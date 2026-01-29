import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import FormData from 'form-data'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

function parseRandomText(text = '') {
  return text.replace(/\{([^}]+)\}/g, (_, g) =>
    pick(g.split('|'))
  )
}

export async function postReels(job) {
  if (!fs.existsSync(job.videoPath)) {
    throw new Error('Video folder not found')
  }

  const videos = fs.readdirSync(job.videoPath).filter(f =>
    f.endsWith('.mp4')
  )

  if (!videos.length) {
    throw new Error('No mp4 file')
  }

  const file = pick(videos)
  const caption = parseRandomText(job.caption || '')

  const form = new FormData()
  form.append('access_token', job.pageToken)
  form.append('description', caption)
  form.append(
    'source',
    fs.createReadStream(path.join(job.videoPath, file))
  )

  const res = await fetch(
    `https://graph.facebook.com/v24.0/${job.pageId}/videos`,
    { method: 'POST', body: form }
  )

  const json = await res.json()
  if (json.error) throw new Error(json.error.message)

  return {
    reelId: json.id,
    reelLink: `https://www.facebook.com/${json.id}`
  }
}

export async function postComment(job) {
  if (!job.comment) return true

  const text = parseRandomText(job.comment)

  await fetch(
    `https://graph.facebook.com/v24.0/${job.reelId}/comments`,
    {
      method: 'POST',
      body: new URLSearchParams({
        access_token: job.pageToken,
        message: text
      })
    }
  )

  return true
}
