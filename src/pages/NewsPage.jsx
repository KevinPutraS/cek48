import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { Link } from "react-router-dom";
import "../styles/news.css";

export default function NewsPage() {
  const [latestNews, setLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/jkt48-news?page=1`);
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error || "Gagal mengambil berita");
      }

      const allNews = json.data?.data || json.data;
      
      if (allNews && allNews.length > 0) {
        setLatestNews(allNews);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryAccent(category) {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("theater") || cat.includes("teater")) return "#ff4f9a"; 
    if (cat.includes("event")) return "#42d5f5"; 
    if (cat.includes("merchandise")) return "#ffd369"; 
    return "#806cff"; 
  }

  return (
    <div className="app-shell">
      <TopBar
        sectionLabel="NEWS"
        sectionDescription="Berita terbaru JKT48"
        showControls={false}
      />

      <main id="main-content" className="nx-page nx-news-page">
        {/* HERO SECTION MATCHING MEMBER UNIVERSE REDESIGN */}
        <section className="cek-hero-section">
          <div className="nx-members-hero__signals">
            <span><i></i>OFFICIAL ANNOUNCEMENT</span>
          </div>
          <h1>NEWS <span>UNIVERSE</span></h1>
          <p>Dapatkan semua informasi terbaru dari JKT48, mulai dari Theater, Event, dan Digital Photobook.</p>
        </section>

        {loading && <div className="nx-news-state-info"><span className="spinner"></span><p>Loading berita...</p></div>}
        {error && (
          <div className="nx-news-state-info is-error">
            <p>{error}</p>
            <button type="button" onClick={loadNews}>Coba lagi</button>
          </div>
        )}

        {!loading && !error && latestNews.length > 0 && (
          <section>
            <div className="nx-member-results">
              <div>
                <span>LATEST UPDATE</span>
                <h2>Pengumuman Resmi</h2>
              </div>
            </div>
            
            <div className="cek-news-list-grid">
              {latestNews.map((item) => (
                <Link
                  key={item.link}
                  to={`/news/${item.link}`}
                  className="cek-news-text-card"
                  style={{ "--card-accent": getCategoryAccent(item.category) }}
                >
                  <div className="cek-ntc-header">
                    <span className="cek-cat-badge"><i></i>{item.category}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <div className="cek-ntc-footer">
                    <span className="cek-date">
                      {new Date(item.valid_date_from).toLocaleDateString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className="cek-card-read-more">Baca ➔</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}