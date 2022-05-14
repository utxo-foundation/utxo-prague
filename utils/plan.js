import { format, parse } from "https://deno.land/std@0.139.0/datetime/mod.ts";
import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();
const entry = utxo.entries["22"];
const specs = entry.specs;
const index = entry.index;

class UTXOPlanner {
  constructor() {
    this.eventsOriginal = specs.events.filter((ev) =>
      ev.type !== "lightning" && ev.duration
    );
    this.events = JSON.parse(JSON.stringify(this.eventsOriginal));
    this.stages = specs.stages;
    this.startTime = new Date();
    this.schedule = [];
    this.unscheduled = [];
    this.tries = {};

    // normalize stages
    for (const stage of this.stages) {
      stage.timesFull = stage.times.map((st) => this.parsePeriod(st));
    }
    for (const ev of this.events) {
      const haveAfter = this.events.find((e) =>
        e.after === ev.id || e.rightAfter === ev.id
      );
      ev.priority = haveAfter ? 10 : 0;
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
      stage: data.stage,
      period: data.period,
      event: ev.id,
    });
    this.events.splice(this.events.indexOf(ev), 1);
    console.log(
      `Event ${ev.id} scheduled: ${data.stage} ${JSON.stringify(data.period)}`,
    );
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

    for (const segment of stage.timesFull) {
      segmentCount++;
      if (segmentCount >= skipSegments) {
        let ctime = segment.start;
        while (ctime.getTime() < segment.end.getTime()) {
          const evPeriod = this.eventPeriod(ev, ctime);
          if (evPeriod.end.getTime() <= segment.end.getTime()) {
            const conflicts = this.findConflicts(stage, evPeriod);
            if (conflicts === 0) {
              return evPeriod;
              //this.addEvent(ev, { stage: stage.id, period: evPeriod })
              //return null
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

  eventSlotValidator(ev, slot) {
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
    return true;
  }

  iterate() {
    const priorityEvents = this.events.filter((e) => e.priority > 0);
    const events = priorityEvents.length > 0 ? priorityEvents : this.events;

    const rand = Math.floor(Math.random() * events.length);
    const ev = events[rand];

    const availStages = this.stages.filter((st) => st.types.includes(ev.type))
      .map((s) => s.id);
    if (availStages.length === 0) {
      this.events.splice(this.events.indexOf(ev), 1);
      this.unscheduled.push(ev.id);
      return null;
    }

    if (!this.tries[ev.id]) {
      this.tries[ev.id] = 0;
    }
    this.tries[ev.id]++;
    if (this.tries[ev.id] > 5000) {
      this.events.splice(this.events.indexOf(ev), 1);
      this.unscheduled.push(ev.id);
      return null;
    }

    const randStage = Math.floor(Math.random() * availStages.length);
    const stage = this.stages.find((s) => s.id === availStages[randStage]);
    const slot = this.findSlotInStage(ev, stage);
    if (slot) {
      const valid = this.eventSlotValidator(ev, slot);
      if (valid) {
        this.addEvent(ev, { stage: stage.id, period: slot });
      }
    }

    const diff = (new Date()).getTime() - this.startTime.getTime();
    if ((new Date()).getTime() - this.startTime.getTime() > (1000 * 3)) {
      console.log(this.events.map((e) => e.id));
    }
    //Deno.exit()
  }

  plan() {
    // nejprve umistime fixed
    for (const ev of this.events.filter((e) => e.fixed && e.fixed.time)) {
      this.addFixedEvent(ev);
    }

    while (this.events.length > 0) {
      this.iterate();
    }

    this.renderResults();
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

const planner = new UTXOPlanner();
planner.plan();
