const { readJobs, updateRow } = require("./googleSheet");
const { postReels, postComment } = require("./facebook");

async function main() {
  const now = new Date();

  const jobs = await readJobs();

  if (jobs.length === 0) {
    console.log("No job found");
    return;
  }

  // ===== ƯU TIÊN NOW =====
  let job =
    jobs.find(j => j.status === "NOW") ||
    jobs.find(j =>
      j.status === "WAIT" &&
      new Date(j.scheduleTime) <= now
    ) ||
    jobs.find(j =>
      j.status === "POSTED" &&
      j.comment === "WAIT" &&
      new Date(j.delayComment) <= now
    );

  if (!job) {
    console.log("No executable job");
    return;
  }

  console.log("RUN JOB:", job);

  // ===== POST REELS =====
  if (job.status === "NOW" || job.status === "WAIT") {

    const link = await postReels(job);

    const delayMinutes = random(5, 10);
    const delayTime = new Date(Date.now() + delayMinutes * 60000);

    await updateRow(job.row, {
      Status: "POSTED",
      "Link Reels": link,
      "Delay Comment": delayTime.toISOString(),
      Comment: "WAIT"
    });

    return;
  }

  // ===== COMMENT =====
  if (job.status === "POSTED" && job.comment === "WAIT") {

    await postComment(job.linkReels, job);

    await updateRow(job.row, {
      Comment: "DONE"
    });

    return;
  }
}

function random(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

main();
