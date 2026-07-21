// File: api/jkt48-live.js

export default async function handler(req, res) {
  // Cache 60 detik agar tidak diblokir Showroom/IDN
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');


  try {
    // SEKARANG KITA 100% MANDIRI! 
    const [showroomData, idnData] = await Promise.allSettled([
      fetchShowroomMandiri(),
      fetchIDNMandiri() // Menggunakan jurus rahasia dari komunitas
    ]);

    const result = [
      ...(showroomData.status === 'fulfilled' ? showroomData.value : []),
      ...(idnData.status === 'fulfilled' ? idnData.value : [])
    ];

    return res.status(200).json(result);
  } catch (error) {
    console.error("Kesalahan Sistem Server:", error);
    return res.status(500).json([]);
  }
}

// ---------------------------------------------------------
// 1. FUNGSI FETCH SHOWROOM MANDIRI
// ---------------------------------------------------------
async function fetchShowroomMandiri() {
  try {
    const res = await fetch("https://www.showroom-live.com/api/live/onlives");
    if (!res.ok) return [];
    
    const data = await res.json();
    const idolCategory = data.onlives?.find(category => category.genre_name === "Idol");

    if (idolCategory && idolCategory.lives) {
      const filteredLives = idolCategory.lives.filter(room => 
        (room.room_name || "").includes("JKT48") || 
        (room.room_url_key || "").includes("JKT48")
      );

      // Di dalam api/jkt48-live.js (bagian Showroom)
      return filteredLives.map(m => {
        let cleanName = (m.main_name || m.room_name || "Member").split(" ")[0];
        cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, '');

        return {
          name: cleanName,
          url: `https://www.showroom-live.com/r/${m.room_url_key}`,
          image_url: m.image_square || m.image || "",
          platform: "Showroom",
          room_id: m.room_id // <--- TAMBAHKAN BARIS INI
        };
      });
    }
    return [];
  } catch (err) {
    console.error("Error Showroom:", err.message);
    return [];
  }
}

// ---------------------------------------------------------
// 2. FUNGSI FETCH IDN MANDIRI (REVERSE-ENGINEERED)
// ---------------------------------------------------------
async function fetchIDNMandiri() {
  try {
    // Kita gunakan query spesifik (SearchLivestream) hasil temuanmu
    const graphqlQuery = `query SearchLivestream { searchLivestream(query: "", limit: 100) { next_cursor result { slug title image_url view_count playback_url room_identifier status live_at end_at scheduled_at gift_icon_url category { name slug } creator { uuid username name avatar bio_description following_count follower_count is_follow } } }}`;

    const res = await fetch("https://api.idn.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: graphqlQuery })
    });

    if (!res.ok) {
      console.error(`IDN Error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    // Mengikuti struktur data dari query komunitas
    const liveStreams = json?.data?.searchLivestream?.result || [];

    // Filter khusus JKT48
    const jkt48Lives = liveStreams
      .filter(stream => {
        const name = (stream.creator?.name || "").toLowerCase();
        const username = (stream.creator?.username || "").toLowerCase();
        return name.includes("jkt48") || username.includes("jkt48");
      })
      .map(m => ({
        // Format disamakan dengan kebutuhan frontend
        name: (m.creator?.name || "Member").split(" ")[0],
        url: `https://www.idn.app/${m.creator?.username}/live/${m.slug}`,
        image_url: m.creator?.avatar || m.image_url || "",
        platform: "IDN"
      }));

    return jkt48Lives;
  } catch (err) {
    console.error("Error IDN:", err.message);
    return [];
  }
}