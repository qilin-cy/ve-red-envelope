// trigger redeploy

import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db
      .collection("messages")
      .orderBy("time", "desc")
      .get();
    const results = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        text: d.text,
        time: d.time
          ? d.time
              .toDate()
              .toLocaleString("zh-CN", {
                timeZone: "Asia/Shanghai",
                hour12: false,
              })
          : "",
      };
    });
    res.status(200).json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}
