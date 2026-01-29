import { readJobs, updateJob } from './googleSheet.js'
import { postReels, postComment } from './facebook.js'

function random(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

async function main() {
  const now = new Date()
  const jobs = await readJobs()

  if (!jobs.length) {
    console.log('No job found')
    return
  }

  const job =
    jobs.find(j => j.Status === 'NOW') ||
    jobs.find(
      j =>
        j.Status === 'WAIT' &&
        new Date(j.ScheduleTime) <= now
    ) ||
    jobs.find(
      j =>
        j.Status === 'POSTED' &&
        j.Comment === 'WAIT' &&
        new Date(j.DelayComment) <= now
    )

  if (!job) {
    console.log('No executable job')
    return
  }

  console.log('RUN JOB:', job)

  // ===== POST REELS =====
  if (job.Status === 'NOW' || job.Status === 'WAIT') {
    const { reelId, reelLink } = await postReels(job)

    const delayMin = random(5, 10)
    const delayTime = new Date(Date.now() + delayMin * 60000)

    await updateJob(job, 'POSTED', reelLink)
    job.DelayComment = delayTime.toISOString()
    job.Comment = 'WAIT'
    await job.save()
    return
  }

  // ===== COMMENT =====
  if (job.Status === 'POSTED' && job.Comment === 'WAIT') {
    await postComment({
      ...job,
      reelId: job.ReelId
    })

    job.Comment = 'DONE'
    await job.save()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
