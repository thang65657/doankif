import React, { useState, useEffect } from "react";
import { BookOpen, Search, Sparkles, ChevronRight, X, Loader2, Plus, Clock, ExternalLink, HeartPulse, Library, ShieldCheck } from "lucide-react";
import { api } from "../lib/api.js";
import { IArticle } from "../types.js";

interface KnowledgeHubProps {
  user: any;
}

const renderInlineText = (text: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>
      : <React.Fragment key={index}>{part}</React.Fragment>
  );

const renderArticleContent = (content: string) => {
  let orderedIndex = 0;
  return content.split("\n").map((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return <div key={index} className="h-2" />;
    if (line.startsWith("### ")) {
      orderedIndex = 0;
      return <h3 key={index} className="mt-6 mb-2 text-lg font-extrabold text-slate-900">{line.slice(4)}</h3>;
    }
    if (line.startsWith("## ")) {
      orderedIndex = 0;
      return <h2 key={index} className="mt-7 mb-3 text-xl font-black text-indigo-950">{line.slice(3)}</h2>;
    }
    if (/^[-*]\s+/.test(line)) {
      orderedIndex = 0;
      return <div key={index} className="my-2 flex items-start gap-3 text-sm leading-7 text-slate-700"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" /><span>{renderInlineText(line.replace(/^[-*]\s+/, ""))}</span></div>;
    }
    if (/^\d+\.\s+/.test(line)) {
      orderedIndex += 1;
      return <div key={index} className="my-2 flex items-start gap-3 text-sm leading-7 text-slate-700"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[11px] font-black text-indigo-700">{orderedIndex}</span><span>{renderInlineText(line.replace(/^\d+\.\s+/, ""))}</span></div>;
    }
    orderedIndex = 0;
    return <p key={index} className="text-sm leading-7 text-slate-700">{renderInlineText(line)}</p>;
  });
};

export default function KnowledgeHub({ user }: KnowledgeHubProps) {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<IArticle | null>(null);

  // Authoring states for doctors/admins
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dinh dưỡng");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState(user?.fullName || "");
  const [imageUrl, setImageUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const loadArticles = async () => {
    try {
      const data = await api.getArticles();
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setPublishing(true);

    try {
      await api.createArticle({
        title,
        category,
        summary,
        content,
        author,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600",
      });

      // reset form & reload
      setTitle("");
      setSummary("");
      setContent("");
      setImageUrl("");
      setShowAddForm(false);
      loadArticles();
    } catch (err: any) {
      setFormError(err.message || "Đăng bài thất bại.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const categories = Array.from(new Set<string>(articles.map(article => article.category))).sort((a, b) => a.localeCompare(b, "vi"));

  // Filter articles
  const filtered = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const featuredArticle = !searchTerm && !selectedCategory
    ? (filtered.find(article => article.featured) || filtered[0] || null)
    : null;
  const gridArticles = featuredArticle ? filtered.filter(article => article._id !== featuredArticle._id) : filtered;
  const relatedArticles = selectedArticle
    ? articles.filter(article => article._id !== selectedArticle._id && (
        article.category === selectedArticle.category || article.tags?.some(tag => selectedArticle.tags?.includes(tag))
      )).slice(0, 3)
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-7 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur">
              <Library className="h-4 w-4" /> Thư viện kiến thức MedTech
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Cẩm nang sức khỏe dễ hiểu</h1>
              <p className="mt-2 text-sm leading-6 text-blue-50/90 sm:text-base">Đọc chỉ số máu, chuẩn bị xét nghiệm, dinh dưỡng và lối sống qua các bài ngắn có nguồn tham khảo.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold">
              <span className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur"><strong className="text-base">{articles.length}</strong> bài viết</span>
              <span className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur"><strong className="text-base">{categories.length}</strong> chủ đề</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 backdrop-blur"><ShieldCheck className="h-4 w-4" /> Có nguồn tham khảo</span>
            </div>
          </div>

          {(user?.role === "doctor" || user?.role === "admin") && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-blue-50 text-indigo-700 font-extrabold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Đăng bài viết y học
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm RBC, WBC, tiểu cầu, dinh dưỡng, vận động..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
              !selectedCategory ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                selectedCategory === cat ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {featuredArticle && (
        <button
          type="button"
          onClick={() => setSelectedArticle(featuredArticle)}
          className="group grid w-full overflow-hidden rounded-[2rem] border border-indigo-100 bg-white text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl md:grid-cols-[1.1fr_1fr] cursor-pointer"
        >
          <div className="relative min-h-64 overflow-hidden bg-slate-100">
            <img
              src={featuredArticle.imageUrl || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=900"}
              alt={featuredArticle.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg"><Sparkles className="h-3.5 w-3.5" /> Bài nổi bật</span>
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-9">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">{featuredArticle.category}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featuredArticle.readingMinutes || 4} phút đọc</span>
            </div>
            <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{featuredArticle.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 line-clamp-3">{featuredArticle.summary}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-indigo-600">Đọc bài viết <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </div>
        </button>
      )}

      {/* Articles Grid layout */}
      <div className="grid md:grid-cols-3 gap-8">
        {gridArticles.length > 0 ? (
          gridArticles.map((art) => (
            <div
              key={art._id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer hover:-translate-y-1"
            >
              <img
                src={art.imageUrl || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400"}
                alt={art.title}
                className="w-full h-48 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase">{art.category}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400"><Clock className="h-3.5 w-3.5" /> {art.readingMinutes || Math.max(2, Math.ceil(art.content.split(/\s+/).length / 220))} phút</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug">{art.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{art.summary}</p>
                  {art.tags && art.tags.length > 0 && <div className="flex flex-wrap gap-1.5 pt-1">{art.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">#{tag}</span>)}</div>}
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between items-center pt-3 border-t border-slate-50">
                  <span className="flex items-center gap-1 font-medium">✍️ Người viết: {art.author}</span>
                  <span>{new Date(art.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>
          ))
        ) : !featuredArticle ? (
          <div className="col-span-3 bg-white py-16 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-800">Không tìm thấy bài viết nào</h3>
              <p className="text-slate-400 text-xs mt-1">Thay đổi từ khóa lọc hoặc quay lại sau.</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Reader Modal View */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="relative h-64 shrink-0 bg-slate-100">
              <img src={selectedArticle.imageUrl} alt="banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase">
                  {selectedArticle.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">{selectedArticle.title}</h2>
                <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                  <span>Biên soạn: <strong>{selectedArticle.author}</strong></span>
                  <span>Đăng ngày: {new Date(selectedArticle.createdAt).toLocaleDateString("vi-VN")}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedArticle.readingMinutes || Math.max(2, Math.ceil(selectedArticle.content.split(/\s+/).length / 220))} phút đọc</span>
                </div>
                {selectedArticle.tags && <div className="flex flex-wrap gap-2">{selectedArticle.tags.map(tag => <span key={tag} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">#{tag}</span>)}</div>}
              </div>

              <blockquote className="p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-xl text-slate-600 italic text-sm leading-relaxed">
                "{selectedArticle.summary}"
              </blockquote>

              <div className="space-y-1">
                {renderArticleContent(selectedArticle.content)}
              </div>

              {selectedArticle.sourceUrl && (
                <a
                  href={selectedArticle.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-800 transition-colors hover:bg-blue-50"
                >
                  <span><span className="block text-[10px] font-black uppercase tracking-wider text-blue-500">Nguồn tham khảo</span><strong>{selectedArticle.sourceLabel || "Xem tài liệu gốc"}</strong></span>
                  <ExternalLink className="h-5 w-5 shrink-0" />
                </a>
              )}

              <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <span>Nội dung chỉ để tham khảo, không thay thế chẩn đoán hoặc chỉ định điều trị. Nếu có triệu chứng bất thường hoặc kết quả vượt ngưỡng, hãy trao đổi với bác sĩ.</span>
              </div>

              {relatedArticles.length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="mb-3 font-extrabold text-slate-900">Bài viết liên quan</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {relatedArticles.map(article => (
                      <button key={article._id} type="button" onClick={() => setSelectedArticle(article)} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer">
                        <span className="text-[9px] font-black uppercase text-indigo-600">{article.category}</span>
                        <span className="mt-1 block text-xs font-bold leading-5 text-slate-800 line-clamp-2">{article.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Đóng bài đọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal for Doctors */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handlePublishSubmit}
            className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Đăng bài viết y học lên Cổng thông tin
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Tựa đề bài báo</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tác hại của chất béo chuyển hóa..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Thể loại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Dinh dưỡng">Dinh dưỡng</option>
                  <option value="Hướng dẫn">Hướng dẫn</option>
                  <option value="Chỉ số máu">Chỉ số máu</option>
                  <option value="Tim mạch">Tim mạch</option>
                  <option value="Lối sống">Lối sống</option>
                  <option value="Bệnh lý">Bệnh lý</option>
                  <option value="Lời khuyên">Lời khuyên</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Bác sĩ / Tác giả thực hiện</label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="BS. Nguyễn Minh Đức"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Ảnh bìa (URL - Tùy chọn)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Tóm tắt ngắn</label>
                <textarea
                  required
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Sơ lược nội dung cốt lõi của bài báo..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 mb-1">Nội dung chi tiết</label>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết nội dung bài báo khoa học..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer disabled:bg-blue-400"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng bài ngay"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
