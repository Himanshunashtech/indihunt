// Upstash Redis and QStash REST API helpers

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const QSTASH_URL = process.env.QSTASH_URL || "";
const QSTASH_TOKEN = process.env.QSTASH_TOKEN || "";

export async function redisGet(key: string): Promise<any> {
  try {
    const res = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : null;
  } catch (err) {
    console.error("Redis Get Error:", err);
    return null;
  }
}

export async function redisSet(key: string, value: any, exSeconds?: number): Promise<boolean> {
  try {
    const bodyStr = JSON.stringify(value);
    const url = exSeconds 
      ? `${REDIS_URL}/set/${key}/${encodeURIComponent(bodyStr)}/EX/${exSeconds}`
      : `${REDIS_URL}/set/${key}/${encodeURIComponent(bodyStr)}`;
      
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.error("Redis Set Error:", err);
    return false;
  }
}

export async function publishQStashEvent(destination: string, payload: any): Promise<boolean> {
  try {
    const res = await fetch(`${QSTASH_URL}/v1/publish/${destination}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error("QStash Publish Error:", err);
    return false;
  }
}
