import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import TopBar from "../components/TopBar";
import "../styles/news-detail.css";

export default function NewsDetailPage() {
  const { slug } = useParams(); 
  const navigate = useNavigate();
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNewsDetail();
  }, [slug]);

  async function loadNewsDetail() {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(
        `/api/jkt48-news-detail?slug=${encodeURIComponent(slug)}`
      );
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server tidak mengembalikan respons JSON.");
      }

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Gagal memuat rincian isi pengumuman.");
      }

      const dataPayload = json.data?.data || json.data;
      setDetail(dataPayload); 

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

  function cleanArticle(html = "") {
    const clean = DOMPurify.sanitize(html);
    const doc = new DOMParser().parseFromString(clean, "text/html");

    doc.querySelectorAll("*").forEach((el) => {
      el.removeAttribute("class");
      el.removeAttribute("id");
      el.removeAttribute("style");
    });

    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.includes("jkt48.com")) {
        img.src = `/api/jkt48-image?url=${encodeURIComponent(src)}`;
      }
      img.removeAttribute("width");
      img.removeAttribute("height");
      
      // FIX: Tambahkan background-color: #ffffff dan ubah object-fit ke contain
      img.setAttribute(
        "style",
        "width: 100% !important; height: auto !important; object-fit: contain !important; background-color: #ffffff !important; padding: 10px !important; margin: 1.5rem 0 !important; display: block !important; border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.075) !important;"
      );
    });

    return doc.body.innerHTML;
  }

  // Fungsi untuk fitur Share (Membuka menu share native HP)
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: detail.title,
          text: `Lihat pengumuman JKT48: ${detail.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Gagal membagikan:", err);
      }
    } else {
      alert("Browser Anda tidak mendukung fitur berbagi.");
    }
  }

  // Fungsi untuk fitur Copy Link
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link berita telah disalin ke clipboard!");
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  }

  return (
    <div className="app-shell">
      <TopBar
        sectionLabel="NEWS DETAIL"
        sectionDescription="Detail pengumuman resmi JKT48"
        showControls={false}
      />

      <main id="main-content" className="nx-page nx-news-detail-page">
        <nav className="cek-detail-nav">
          <button type="button" className="nx-profile-favorite" onClick={() => navigate("/news")}>
            <span>← Kembali ke News</span>
          </button>
          
          <div className="cek-nav-actions">
            <button className="nx-profile-favorite" onClick={handleShare}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
              Bagikan
            </button>
            <button className="nx-profile-favorite" onClick={handleCopy}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Salin Link
            </button>
          </div>
        </nav>

        {loading && <div className="nx-news-state-info"><span className="spinner" /><strong>Mengambil isi pengumuman...</strong></div>}
        {error && (
          <div className="nx-news-state-info is-error">
            <strong>Gagal memuat isi berita</strong><p>{error}</p>
            <button type="button" className="nx-profile-favorite" onClick={loadNewsDetail}>Coba lagi</button>
          </div>
        )}

        {!loading && !error && detail && (
          <article className="cek-article-wrapper" style={{ "--card-accent": getCategoryAccent(detail.category) }}>
            
            {detail.background_image && (
              <header className="cek-article-hero">
                <img src={detail.background_image} alt={detail.title} />
                <div className="cek-hero-shade" />
                <div className="cek-hero-content">
                  <span className="cek-cat-badge">
                    <i></i> {detail.category}
                  </span>
                  <h1>{detail.title}</h1>
                  <div className="cek-article-meta-info">
                    <span>
                      {new Date(detail.valid_date_from).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {detail.news_id && <span>• ID: #{detail.news_id}</span>}
                  </div>
                </div>
              </header>
            )}

            <div className="cek-article-layout">
              <div className="cek-article-main-card">
                <div
                  className="html-parsed-content"
                  dangerouslySetInnerHTML={{
                    __html: cleanArticle(
                      detail.content || detail.body || detail.html || "<p>Pengumuman ini tidak memiliki rincian teks tambahan.</p>"
                    ),
                  }}
                />
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}