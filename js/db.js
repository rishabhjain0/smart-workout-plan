const DB_NAME = "rishabh-fitness-db";
const DB_VERSION = 1;

const WORKOUT_STORE = "workout_logs";
const WEIGHT_STORE = "weight_logs";

let db;

export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onerror = () =>
      reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (
        !db.objectStoreNames.contains(
          WORKOUT_STORE
        )
      ) {
        const workoutStore =
          db.createObjectStore(
            WORKOUT_STORE,
            {
              keyPath: "id",
            }
          );

        workoutStore.createIndex(
          "exerciseId",
          "exerciseId"
        );

        workoutStore.createIndex(
          "date",
          "date"
        );
      }

      if (
        !db.objectStoreNames.contains(
          WEIGHT_STORE
        )
      ) {
        const weightStore =
          db.createObjectStore(
            WEIGHT_STORE,
            {
              keyPath: "id",
            }
          );

        weightStore.createIndex(
          "date",
          "date"
        );
      }
    };
  });
}

export async function logWorkout(
  exerciseId,
  weight
) {
  return new Promise(
    (resolve, reject) => {
      const tx = db.transaction(
        WORKOUT_STORE,
        "readwrite"
      );

      const store =
        tx.objectStore(
          WORKOUT_STORE
        );

      const workout = {
        id: crypto.randomUUID(),
        exerciseId,
        weight,
        date:
          new Date()
            .toISOString()
            .split("T")[0],
        timestamp: Date.now(),
      };

      const request =
        store.add(workout);

      request.onsuccess = () =>
        resolve(workout);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

export async function logWeight(
  weight
) {
  return new Promise(
    (resolve, reject) => {
      const tx = db.transaction(
        WEIGHT_STORE,
        "readwrite"
      );

      const store =
        tx.objectStore(
          WEIGHT_STORE
        );

      const entry = {
        id: crypto.randomUUID(),
        weight,
        date:
          new Date()
            .toISOString()
            .split("T")[0],
        timestamp: Date.now(),
      };

      const request =
        store.add(entry);

      request.onsuccess = () =>
        resolve(entry);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

export async function getWorkoutLogs() {
  return new Promise(
    (resolve, reject) => {
      const tx = db.transaction(
        WORKOUT_STORE,
        "readonly"
      );

      const store =
        tx.objectStore(
          WORKOUT_STORE
        );

      const request =
        store.getAll();

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

export async function getWeightLogs() {
  return new Promise(
    (resolve, reject) => {
      const tx = db.transaction(
        WEIGHT_STORE,
        "readonly"
      );

      const store =
        tx.objectStore(
          WEIGHT_STORE
        );

      const request =
        store.getAll();

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    }
  );
}

export async function getExerciseLogs(
  exerciseId
) {
  const logs =
    await getWorkoutLogs();

  return logs.filter(
    log =>
      log.exerciseId ===
      exerciseId
  );
}


export async function getDashboardStats() {
  const logs = await getWorkoutLogs();

  const uniqueDays = new Set(
    logs.map(log => log.date)
  );

  const now = new Date();

  const currentMonth =
    now.getMonth();

  const currentYear =
    now.getFullYear();

  const monthlyDays =
    new Set(
      logs
        .filter(log => {
          const d =
            new Date(
              log.date
            );

          return (
            d.getMonth() ===
              currentMonth &&
            d.getFullYear() ===
              currentYear
          );
        })
        .map(log => log.date)
    );

  const weekStart =
    new Date();

  weekStart.setDate(
    now.getDate() -
      now.getDay() +
      1
  );

  const weeklyDays =
    new Set(
      logs
        .filter(log =>
          new Date(
            log.date
          ) >= weekStart
        )
        .map(log => log.date)
    );

  return {
    totalWorkouts:
      logs.length,

    daysTrained:
      uniqueDays.size,

    weeklyCompletion:
      Math.min(
        100,
        Math.round(
          (weeklyDays.size /
            5) *
            100
        )
      ),

    monthlyCompletion:
      Math.min(
        100,
        Math.round(
          (monthlyDays.size /
            20) *
            100
        )
      )
  };
}

export async function getWeightStats() {

  const logs =
    await getWeightLogs();

  if (!logs.length) {

    return {
      currentWeight: "--",
      firstWeight: "--",
      change: 0
    };
  }

  logs.sort(
    (a, b) =>
      a.timestamp -
      b.timestamp
  );

  const first =
    logs[0];

  const latest =
    logs[
      logs.length - 1
    ];

  return {

    currentWeight:
      latest.weight,

    firstWeight:
      first.weight,

    change:
      (
        latest.weight -
        first.weight
      ).toFixed(1)

  };
}


export async function getExerciseStats(
  exerciseId
) {

  const logs =
    await getExerciseLogs(
      exerciseId
    );

  if (!logs.length) {

    return {
      count: 0,
      bestWeight: 0,
      lastWeight: 0,
      progress: 0
    };
  }

  logs.sort(
    (a, b) =>
      a.timestamp -
      b.timestamp
  );

  const first =
    logs[0];

  const last =
    logs[
      logs.length - 1
    ];

  const bestWeight =
    Math.max(
      ...logs.map(
        log => log.weight
      )
    );

  return {
    count: logs.length,

    bestWeight,

    lastWeight:
      last.weight,

    progress:
      last.weight -
      first.weight
  };
}