import {
  initDB,
  logWorkout,
  logWeight,
  getDashboardStats,
  getWeightStats,
  getExerciseStats
} from "./db.js";

let workouts = [];
const selectedWeights = {};
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const today =
  days[
    new Date().getDay()
  ];

let currentDay =
  [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday"
  ].includes(today)
    ? today
    : "Monday";

const tabs = document.querySelectorAll(".tab");
function setActiveTab() {

  tabs.forEach(tab => {

    tab.classList.remove(
      "active"
    );

    if (
      tab.dataset.day ===
      currentDay
    ) {

      tab.classList.add(
        "active"
      );
    }
  });
}
const container = document.getElementById("workoutsContainer");
const dayTitle = document.getElementById("dayTitle");
const exerciseCount = document.getElementById("exerciseCount");
const searchInput = document.getElementById("searchInput");




const completedWorkouts =
  JSON.parse(
    localStorage.getItem("completedWorkouts")
  ) || [];

async function loadWorkouts() {
  try {

    await initDB();
    await loadDashboard();
    const response = await fetch("workouts.json");
    workouts = await response.json();

    renderWorkouts();
  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        Failed to load workouts.
      </div>
    `;
  }
}

async function renderWorkouts() {
  const searchValue =
    searchInput.value
      .trim()
      .toLowerCase();

  let filtered = workouts.filter(
    workout =>
      workout.day === currentDay
  );

  if (searchValue) {
    filtered = filtered.filter(
      workout =>
        workout.exerciseName
          .toLowerCase()
          .includes(searchValue)
    );
  }

  dayTitle.textContent =
    currentDay;

  exerciseCount.textContent =
    `${filtered.length} Exercises`;

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        No workouts found
      </div>
    `;
    return;
  }

  const cards =
    await Promise.all(
      filtered.map(
        async workout => {

          const stats =
            await getExerciseStats(
              workout.id
            );

          return `
          <div class="workout-card">

            <img
              src="${workout.image}"
              alt="${workout.exerciseName}"
              class="workout-image">

            <div class="workout-content">

              <h3>
                ${workout.exerciseName}
              </h3>

              <p>
                ${workout.description}
              </p>

              <div class="workout-meta">
                <span class="meta-pill">
                  ${workout.sets} Sets
                </span>

                <span class="meta-pill">
                  ${workout.reps} Reps
                </span>
              </div>

              <div class="exercise-stats">

                <div>
                  Last:
                  ${stats.lastWeight || "-"
            }kg
                </div>

                <div>
                  Best:
                  ${stats.bestWeight || "-"
            }kg
                </div>

                <div>
                  Done:
                  ${stats.count}
                </div>

              </div>

              <div class="weight-logger">

                <button
                  class="weight-btn"
                  onclick="changeWeight(event,'${workout.id}',-2.5)">
                  -
                </button>

                <span
                  id="weight-${workout.id}"
                  class="weight-display">
                  20
                </span>

                <button
                  class="weight-btn"
                  onclick="changeWeight(event,'${workout.id}',2.5)">
                  +
                </button>

              </div>

              <div class="card-actions">

                <button
                  class="log-btn"
                  onclick="logWorkoutClick(event,'${workout.id}')">
                  Log Workout
                </button>

                <button
                  class="details-btn"
                  onclick="event.stopPropagation(); openWorkout('${workout.id}')">
                  Details
                </button>

              </div>

            </div>

          </div>
          `;
        }
      )
    );

  container.innerHTML =
    cards.join("");
}

window.openWorkout =function (id) {

  window.location.href =
    `workout.html?id=${id}`;
};

tabs.forEach(tab => {
  tab.addEventListener(
    "click",
    () => {

      tabs.forEach(btn =>
        btn.classList.remove(
          "active"
        )
      );

      tab.classList.add("active");

      currentDay =
        tab.dataset.day;

      renderWorkouts();
    }
  );
});

searchInput.addEventListener(
  "input",
  renderWorkouts
);

setActiveTab();
loadWorkouts();


window.changeWeight =
  function (
    event,
    workoutId,
    change
  ) {

    event.stopPropagation();

    if (
      !selectedWeights[
      workoutId
      ]
    ) {

      selectedWeights[
        workoutId
      ] = 20;
    }

    selectedWeights[
      workoutId
    ] += change;

    if (
      selectedWeights[
      workoutId
      ] < 0
    ) {

      selectedWeights[
        workoutId
      ] = 0;
    }

    document.getElementById(
      `weight-${workoutId}`
    ).textContent =
      selectedWeights[
      workoutId
      ];
  };

window.logWorkoutClick =
  async function (
    event,
    workoutId
  ) {

    event.stopPropagation();

    const weight =
      selectedWeights[
      workoutId
      ] || 20;

    await logWorkout(
      workoutId,
      weight
    );

    alert(
      `Workout Logged (${weight}kg)`
    );
  };

async function loadDashboard() {

  const stats =
    await getDashboardStats();

  const weight =
    await getWeightStats();

  document.getElementById(
    "totalWorkouts"
  ).textContent =
    stats.totalWorkouts;

  document.getElementById(
    "daysTrained"
  ).textContent =
    stats.daysTrained;

  document.getElementById(
    "weeklyCompletion"
  ).textContent =
    `${stats.weeklyCompletion}%`;

  document.getElementById(
    "monthlyCompletion"
  ).textContent =
    `${stats.monthlyCompletion}%`;

  const currentWeightEl =
    document.getElementById(
      "currentWeight"
    );

  if (
    currentWeightEl
  ) {

    currentWeightEl.textContent =
      weight.currentWeight === "--"
        ? "--"
        : `${weight.currentWeight} kg`;
  }

  const weightChangeEl =
    document.getElementById(
      "weightChange"
    );

  if (
    weightChangeEl
  ) {

    weightChangeEl.textContent =
      weight.currentWeight === "--"
        ? "No weight logs yet"
        : `Started at ${weight.firstWeight}kg • ${
            Number(
              weight.change
            ) > 0
              ? "+"
              : ""
          }${weight.change}kg`;
  }
}


document
  .getElementById(
    "logWeightBtn"
  )
  .addEventListener(
    "click",
    async () => {

      const weight =
        prompt(
          "Enter weight (kg)"
        );

      if (
        !weight
      ) return;

      await logWeight(
        Number(weight)
      );

      await loadDashboard();
    }
  );