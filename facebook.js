// facebook.js
// ==================================================
// FACEBOOK REELS WORKER MODULE
// dùng cho GitHub Worker / Server
// ==================================================

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("form-data");

// ================== UTIL ==================
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// random {a|b|c}
function parseRandomText(text = "") {
  return text.replace(/\{([^}]+)\}/g, (_, g) =>
    pick(g.split("|"))
  );
}

// ==================================================
// 🟢 POST REELS
// ==================================================
async function postReels(job) {
  /**
   * job = {
   *   pageId,
   *   pageToken,
   *   videoPath,     // folder chứa mp4
   *   caption
   * }
   */

  if (!fs.existsSync(job.videoPath)) {
    throw new Error("❌ Không tồn tại thư mục video");
  }

  const videos = fs
    .readdirSync(job.videoPath)
    .filter(f => f.endsWith(".mp4"));

  if (!videos.length) {
    throw new Error("❌ Không có file mp4");
  }

  const file = pick(videos);
  const caption = parseRandomText(job.caption || "");

  console.log("🎬 Video:", file);
  console.log("📝 Caption:", caption);

  const form = new FormData();
  form.append("access_token", job.pageToken);
  form.append("description", caption);
  form.append(
    "source",
    fs.createReadStream(path.join(job.videoPath, file))
  );

  const res = await fetch(
    `https://graph.facebook.com/v24.0/${job.pageId}/videos`,
    {
      method: "POST",
      body: form
    }
  );

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message);
  }

  const reelId = json.id;
  const reelLink = `https://www.facebook.com/${reelId}`;

  console.log("✅ Đăng reels xong:", reelLink);

  return {
    reelId,
    reelLink
  };
}

// ==================================================
// 💬 COMMENT REELS
// ==================================================
async function postComment(job) {
  /**
   * job = {
   *   pageId,
   *   pageToken,
   *   reelId,
   *   comment,
   *   photoDir (optional)
   * }
   */

  if (!job.comment) {
    console.log("⚠️ Không có comment → bỏ qua");
    return true;
  }

  const text = parseRandomText(job.comment);
  console.log("💬 Comment:", text);

  let attachId = null;

  // ===== upload ảnh nếu có =====
  if (job.photoDir && fs.existsSync(job.photoDir)) {
    const imgs = fs
      .readdirSync(job.photoDir)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f));

    if (imgs.length) {
      const img = pick(imgs);

      const f = new FormData();
      f.append("access_token", job.pageToken);
      f.append("published", "false");
      f.append(
        "source",
        fs.createReadStream(path.join(job.photoDir, img))
      );

      const up = await fetch(
        `https://graph.facebook.com/v24.0/${job.pageId}/photos`,
        {
          method: "POST",
          body: f
        }
      );

      const js = await up.json();
      if (!js.error) attachId = js.id;
    }
  }

  // ===== comment =====
  await fetch(
    `https://graph.facebook.com/v24.0/${job.reelId}/comments`,
    {
      method: "POST",
      body: new URLSearchParams({
        access_token: job.pageToken,
        message: text,
        ...(attachId ? { attachment_id: attachId } : {})
      })
    }
  );

  console.log("✅ Comment thành công");
  return true;
}

// ==================================================
module.exports = {
  postReels,
  postComment
};
