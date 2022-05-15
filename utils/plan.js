import { format, parse } from "https://deno.land/std@0.139.0/datetime/mod.ts";
import { UTXOEngine } from "./engine.js";
import { MultiProgressBar } from "https://deno.land/x/progress@v1.2.4/mod.ts";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();
const entry = utxo.entries["22"];
const specs = entry.specs;
const index = entry.index;

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

class UTXOPlanner {
  constructor() {
    this.eventsAll = specs.events;
    this.eventsOriginal = specs.events.filter((ev) =>
      ev.type !== "lightning" && ev.duration
    );
    this.events = JSON.parse(JSON.stringify(this.eventsOriginal));
    this.stages = specs.stages;
    this.startTime = new Date();
    this.schedule = [];
    this.unscheduled = [];
    this.priorityLevel = 10;
    this.tries = {};

    // normalize stages
    for (const stage of this.stages) {
      stage.timesFull = stage.times.map((st) => this.parsePeriod(st));
    }
    for (const ev of this.events) {
      const haveAfter = this.events.filter((e) => {
        return ((e.after && e.after.includes(ev.id)) || e.rightAfter === ev.id);
      });
      ev.priority = haveAfter.length > 0
        ? 10
        : (ev.after || ev.rightAfter ? 5 : 0);

      if (ev.type === "lightning-series") {
        let sarr = [];
        for (
          const sp of this.eventsAll.filter((e) => e.parent === ev.id).map(
            (e) => e.speakers,
          )
        ) {
          sarr = sarr.concat(sp);
        }
        ev.speakers = sarr;
      }
    }
  }

  parsePeriod(str) {
    const [dayNumber, period] = str.split("/");
    const [start, end] = period.split("-");
    const date = index.dates[Number(dayNumber) - 1];
    return {
      start: parse(`${date} ${start}`, "yyyy-MM-dd HH:mm"),
      end: parse(`${date} ${end}`, "yyyy-MM-dd HH:mm"),
    };
  }

  addEvent(ev, data) {
    this.schedule.push({
      date: format(data.period.start, "yyyy-MM-dd"),
      stage: data.stage,
      period: data.period,
      event: ev.id,
    });
    this.events.splice(this.events.indexOf(ev), 1);
    /*console.log(
      `Event ${ev.id} scheduled: ${data.stage} ${JSON.stringify(data.period)}`,
    );*/
  }

  addFixedEvent(ev) {
    this.addEvent(ev, {
      stage: ev.fixed.stage,
      period: this.parsePeriod(ev.fixed.time),
    });
  }

  findConflicts(stage, period) {
    const evs = this.schedule.filter((s) => s.stage === stage.id);
    for (const si of evs) {
      if (
        si.period.start.getTime() < period.end.getTime() &&
        si.period.end.getTime() > period.start.getTime()
      ) {
        return 1;
      }
    }
    return 0;
  }

  eventPeriod(ev, start) {
    return {
      start,
      end: new Date(
        start.getTime() + (Math.ceil(ev.duration / 30) * 30) * 60 * 1000,
      ),
    };
  }

  findSlotInStage(ev, stage) {
    const slotDuration = 15 * 60 * 1000;
    const stageEvents = this.schedule.filter((s) => s.stage === stage.id);
    const skipSegments = Math.floor(Math.random() * stage.timesFull.length) - 1;
    let segmentCount = 0;

    for (const segment of shuffle(stage.timesFull)) {
      segmentCount++;
      if (segmentCount >= skipSegments) {
        let ctime = segment.start;
        while (ctime.getTime() < segment.end.getTime()) {
          const evPeriod = this.eventPeriod(ev, ctime);
          if (evPeriod.end.getTime() <= segment.end.getTime()) {
            const conflicts = this.findConflicts(stage, evPeriod);
            if (conflicts === 0) {
              if (this.eventSlotValidator(ev, evPeriod, stage)) {
                return evPeriod;
              }
            }
          }
          ctime = new Date(ctime.getTime() + slotDuration);
        }
      }
    }
  }

  isPeriodOverlap(x, y) {
    return (x.start.getTime() < y.end.getTime() &&
      x.end.getTime() > y.start.getTime());
  }

  eventSlotValidator(ev, slot, stage) {
    // check "after"
    if (ev.after) {
      for (const tId of ev.after) {
        const target = this.schedule.find((si) => si.event === tId);
        if (!target) {
          return false;
        }
        if (target.period.end.getTime() > slot.start.getTime()) {
          return false;
        }
      }
    }
    // check "rightAfter"
    if (ev.rightAfter) {
      const target = this.schedule.find((si) => si.event === ev.rightAfter);
      if (!target) {
        return false;
      }
      if (target.stage !== stage.id) {
        return false;
      }
      if (target.period.end.getTime() !== slot.start.getTime()) {
        return false;
      }
    }
    // check speakers
    for (const si of this.schedule) {
      const sev = this.eventsOriginal.find((e) => e.id === si.event);
      const speakers = ev.speakers.reduce(
        (prev, current) => sev.speakers.includes(current) ? prev + 1 : prev,
        0,
      );
      if (speakers > 0) {
        if (this.isPeriodOverlap(si.period, slot)) {
          return false;
        }
      }
    }
    // check speakers availability
    for (const spId of ev.speakers) {
      const sp = specs.speakers.find((s) => s.id === spId);
      if (!sp) {
        continue;
      }
      if (sp.available) {
        let okey = false;
        for (const spa of sp.available) {
          if (
            this.isPeriodOverlap({
              start: new Date(spa.from),
              end: new Date(spa.to),
            }, slot)
          ) {
            okey = true;
          }
        }
        if (!okey) {
          return false;
        }
      }
    }

    return true;
  }

  iterate() {
    const priorityEvents = this.events.filter((e) => e.priority > 0);

    const events = priorityEvents.length > 0 ? priorityEvents : this.events;

    const rand = Math.floor(Math.random() * events.length);
    const ev = events[rand];

    if (!this.tries[ev.id]) {
      this.tries[ev.id] = 0;
    }
    this.tries[ev.id]++;
    if (this.tries[ev.id] > 30) {
      this.events.splice(this.events.indexOf(ev), 1);
      this.unscheduled.push(ev.id);
      return null;
    }

    const availStages = this.stages.filter((st) => st.types.includes(ev.type))
      .map((s) => s.id);
    if (availStages.length === 0) {
      this.events.splice(this.events.indexOf(ev), 1);
      this.unscheduled.push(ev.id);
      return null;
    }

    let stage = null;
    if (ev.fixed && ev.fixed.stage) {
      if (!availStages.includes(ev.fixed.stage)) {
        return null;
      }
      stage = this.stages.find((s) => s.id === ev.fixed.stage);
    } else {
      const randStage = Math.floor(Math.random() * availStages.length);
      stage = this.stages.find((s) => s.id === availStages[randStage]);
    }

    const slot = this.findSlotInStage(ev, stage);
    if (slot) {
      //const valid = this.eventSlotValidator(ev, slot, stage);
      //if (valid) {
      this.addEvent(ev, { stage: stage.id, period: slot });
      //}
    }

    const diff = (new Date()).getTime() - this.startTime.getTime();
    if ((new Date()).getTime() - this.startTime.getTime() > (1000 * 3)) {
      console.log(this.events.map((e) => e.id));
    }
    //Deno.exit()
  }

  plan() {
    // nejprve umistime fixed
    for (
      const ev of this.eventsOriginal.filter((e) => e.fixed && e.fixed.time)
    ) {
      this.addFixedEvent(ev);
    }

    while (this.events.length > 0) {
      this.iterate();
    }

    // calculate metrics
    for (const si of this.schedule) {
      const ev = this.eventsOriginal.find((e) => e.id === si.event);

      // calculate themes crossing
      const crossings = [];
      for (const ssi of this.schedule) {
        if (ssi.event === si.event) {
          continue;
        }
        if (this.isPeriodOverlap(si.period, ssi.period)) {
          const eev = this.eventsOriginal.find((e) => e.id === ssi.event);
          const tagsCrossing = ev.tags.reduce((prev, cur) =>
            prev + (eev.tags.includes(cur)
              ? 0
              : 1), 0) / ev.tags.length;
          crossings.push([
            ev.track === eev.track
              ? 0
              : 1,
            tagsCrossing,
            ssi,
          ]);
        }
      }

      si.metrics = {
        themeCrossing: (crossings.reduce((prev, cur) =>
          prev + cur[0], 0) / crossings.length),
        tagsCrossing: (crossings.reduce((prev, cur) =>
          prev + cur[1], 0) / crossings.length),
      };
    }
  }

  calcScheduleMetric(metric) {
    return this.schedule.reduce(
      (prev, cur) =>
        prev + (cur.metrics && cur.metrics[metric] ? cur.metrics[metric] : 1),
      0,
    ) / this.schedule.length;
  }

  metrics() {
    const cols = ["themeCrossing", "tagsCrossing"];
    const obj = {};
    let total = 0;
    for (const col of cols) {
      obj[col] = this.calcScheduleMetric(col);
      total += obj[col];
    }
    obj.score = total / cols.length;
    return obj;
  }

  formatTime() {
  }

  renderResults() {
    console.log("----------------");
    for (const date of index.dates) {
      const dateItems = this.schedule.filter((s) => {
        return s.period.start.getTime() <
            parse(`${date} 23:59`, "yyyy-MM-dd HH:mm").getTime() &&
          s.period.start.getTime() >
            parse(`${date} 00:00`, "yyyy-MM-dd HH:mm").getTime();
      });
      console.log(`[${date}]`);
      for (const stage of this.stages) {
        console.log(`  [${stage.id}]`);
        const items = dateItems.filter((s) => s.stage === stage.id).sort((
          x,
          y,
        ) => x.period.start > y.period.start ? 1 : -1);
        for (const item of items) {
          console.log(
            `    ${format(item.period.start, "HH:mm")}-${
              format(item.period.end, "HH:mm")
            } ~ ${item.event}`,
          );
        }
      }
    }
    console.log(
      `Events: ${this.eventsOriginal.length}, assigned: ${this.schedule.length}, unscheduled: ${this.unscheduled}`,
    );
  }
}

async function main() {
  const limit = 100000;
  let i = 0;
  console.log("Planning started ..");

  const plans = [];

  while (i < limit) {
    const planner = new UTXOPlanner();
    planner.plan();
    //console.log(JSON.stringify(planner.unscheduled))

    if (planner.unscheduled.length === 0) {
      //planner.renderResults()
      const metrics = planner.metrics();
      console.log(
        `solution #${
          plans.length + 1
        } : score ${metrics.score} {themeCrossing: ${metrics.themeCrossing}, tagsCrossing: ${metrics.tagsCrossing}}`,
      );
      //console.log(`----\nPlan found after ${i} tries`)
      //break
      plans.push({ schedule: planner.schedule, metrics });
    }

    if (plans.length >= 10) {
      const outputFn = "./dist/22/schedule.json";
      console.log(`Writing result: ${outputFn}`);
      const filtered = plans.sort((x, y) =>
        x.metrics.score > y.metrics.score ? -1 : 1
      ).slice(0, 20);
      Deno.writeTextFile(outputFn, JSON.stringify(filtered, null, 2));
      break;
    }

    if (i % 100 === 0) {
      console.log(`${i}/${limit} - solutions: ${plans.length}`);
    }
    i++;
  }
}

main();
