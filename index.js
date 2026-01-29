const { readJobs, updateJob } = require('./googleSheet')
const { postReels, postComment } = require('./facebook')

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
    jobs.find(j => j.Status === 'WAIT' && new Date(j.ScheduleTime) <= now) ||
    jobs.find(j => j.Status === 'POSTED' && j.Comment === 'WAIT' && new Date(j.DelayComment) <= now)

  if (!job) {
    console.log('No executable job')
    return
  }

  if (job.Status === 'NOW' || job.Status === 'WAIT') {
    const { reelId, reelLink } = await postReels(job)

    job.Status = 'POSTED'
    job.ReelId = reelId
    job.LinkReels = reelLink
    job.DelayComment = new Date(Date.now() + random(5, 10) * 60000).toISOString()
    job.Comment = 'WAIT'
    await job.save()
    return
  }

  if (job.Status === 'POSTED' && job.Comment === 'WAIT') {
    await postComment(job)
    job.Comment = 'DONE'
    await job.save()
  }
}

main().catch(console.error)
