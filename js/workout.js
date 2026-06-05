import {
  initDB,
  getExerciseStats,
  logWorkout
} from "./db.js";


let currentWorkout;
let currentWeight = 20;

const container =
  document.getElementById(
    "workoutDetail"
  );

const params =
  new URLSearchParams(
    window.location.search
  );

const workoutId =
  params.get("id");

let workouts = [];

async function loadWorkout() {

  try {

    await initDB();

    const response =
      await fetch(
        "workouts.json"
      );

    workouts =
      await response.json();

    const workout =
      workouts.find(
        w =>
          w.id === workoutId
      );

    if (!workout) {

      container.innerHTML = `
        <div class="empty-state">
          Workout not found
        </div>
      `;

      return;
    }

    const stats =
      await getExerciseStats(
        workout.id
      );

    currentWorkout =
  workout;

currentWeight =
  stats.lastWeight || 20;

renderWorkout(
  workout,
  stats
);

  } catch (err) {

    console.error(err);

    container.innerHTML = `
      <div class="empty-state">
        Failed to load workout
      </div>
    `;
  }
}

function getYoutubeEmbed(
  url
) {

  if (
    url.includes(
      "shorts/"
    )
  ) {

    const id =
      url
        .split(
          "shorts/"
        )[1]
        .split("?")[0];

    return `https://www.youtube.com/embed/${id}`;
  }

  if (
    url.includes(
      "watch?v="
    )
  ) {

    const id =
      url
        .split(
          "watch?v="
        )[1]
        .split("&")[0];

    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
}

function renderWorkout(
  workout,
  stats
) {

  const completed =
    JSON.parse(
      localStorage.getItem(
        "completedWorkouts"
      )
    ) || [];

  const isCompleted =
    completed.includes(
      workout.id
    );

  const currentIndex =
    workouts.findIndex(
      w =>
        w.id === workout.id
    );

  const prevWorkout =
    workouts[
      currentIndex - 1
    ];

  const nextWorkout =
    workouts[
      currentIndex + 1
    ];

  container.innerHTML = `

    <img
      class="hero-image"
      src="${workout.image}"
      alt="${workout.exerciseName}">

    <div class="detail-content">

      <h1
        class="exercise-title">

        ${workout.exerciseName}

      </h1>

      <p
        class="exercise-description">

        ${workout.description}

      </p>

      <div
        class="info-grid">

        <div
          class="info-card">

          <span>
            DAY
          </span>

          <strong>
            ${workout.day}
          </strong>

        </div>

        <div
          class="info-card">

          <span>
            SETS
          </span>

          <strong>
            ${workout.sets}
          </strong>

        </div>

        <div
          class="info-card">

          <span>
            REPS
          </span>

          <strong>
            ${workout.reps}
          </strong>

        </div>

        <div
          class="info-card">

          <span>
            STATUS
          </span>

          <strong>
            ${
              isCompleted
                ? "Done"
                : "Pending"
            }
          </strong>

        </div>

      </div>

      <div
        class="section">

        <h3>
          Primary Muscles
        </h3>

        <div
          class="muscles">

          ${
            workout.primaryMuscles
              .map(
                muscle =>
                  `
                  <span
                    class="muscle-pill">
                    ${muscle}
                  </span>
                `
              )
              .join("")
          }

        </div>

      </div>

      <div
        class="section">

        <h3>
          Exercise Video
        </h3>

        <div
          class="video-container">

          <iframe
            src="${getYoutubeEmbed(
              workout.video
            )}"
            allowfullscreen>
          </iframe>

        </div>

      </div>

     <div class="floating-workout-logger">

  <button
    class="weight-control-btn"
    onclick="changeWorkoutWeight(-2.5)">
    -
  </button>

  <div
    id="currentWorkoutWeight"
    class="current-workout-weight">

    ${stats.lastWeight || 20}

  </div>

  <button
    class="weight-control-btn"
    onclick="changeWorkoutWeight(2.5)">
    +
  </button>

  <button
    class="log-workout-fixed-btn"
    onclick="logCurrentWorkout()">

    Log Workout

  </button>

</div>

      <div
        class="section">

        <h3>
          Navigation
        </h3>

        <div
          style="
            display:flex;
            gap:12px;
            margin-top:10px;
          ">

          ${
            prevWorkout
              ? `
                <button
                  class="action-btn"
                  style="margin-top:0"
                  onclick="goToWorkout('${prevWorkout.id}')">
                  ← Previous
                </button>
              `
              : ""
          }

          ${
            nextWorkout
              ? `
                <button
                  class="action-btn"
                  style="margin-top:0"
                  onclick="goToWorkout('${nextWorkout.id}')">
                  Next →
                </button>
              `
              : ""
          }

        </div>

      </div>

      <div
        class="footer-space">
      </div>

    </div>
  `;
}

function goToWorkout(
  id
) {

  window.location.href =
    `workout.html?id=${id}`;
}


loadWorkout();



window.changeWorkoutWeight =
function (change) {

  currentWeight += change;

  if (
    currentWeight < 0
  ) {

    currentWeight = 0;
  }

  document.getElementById(
    "currentWorkoutWeight"
  ).textContent =
    currentWeight;
};

window.logCurrentWorkout =
async function () {

  await logWorkout(
    currentWorkout.id,
    currentWeight
  );

  alert(
    `Logged ${currentWorkout.exerciseName} (${currentWeight}kg)`
  );

  location.reload();
};