import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Send, Trash2 } from "lucide-react"; // <-- Added Trash2
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function ActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Posting State
  const [content, setContent] = useState("");
  const [classId, setClassId] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  const loadFeed = () => {
    api.get("/activities").then(r => setActivities(r.data));
  };

  useEffect(() => {
    loadFeed();
    // Only fetch the class list if the user is allowed to post
    if (user.role === "admin" || user.role === "teacher") {
      api.get("/lookup/classes").then(r => setClasses(r.data));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsPosting(true);

    try {
      // 1. Create the text post
      const res = await api.post("/activities", { 
        content, 
        class_id: classId ? Number(classId) : null 
      });

      // 2. Upload photo if selected
      if (photoFile && res.data.id) {
        const fd = new FormData();
        fd.append("file", photoFile);
        await api.post(`/activities/${res.data.id}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Activity posted! 📸");
      setContent("");
      setClassId("");
      setPhotoFile(null);
      loadFeed(); // Refresh the feed to show the new post
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setIsPosting(false);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/activities/${id}`);
      toast.success("Post deleted! 🗑️");
      loadFeed(); // Refresh the feed
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
<div className="max-w-2xl mx-auto space-y-8 pb-12">
      
      {/* Create Post Box (Only visible to Admins & Teachers) */}
      {(user.role === "admin" || user.role === "teacher") && (
        <div className="card-soft p-6 bg-white shadow-sm border border-slate-200">
          <form onSubmit={handlePost}>
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FF8C73] text-white font-bold flex items-center justify-center shrink-0">
                {user.name[0]}
              </div>
              <textarea 
                placeholder="Share a photo or update with parents..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-4 resize-none outline-none focus:ring-2 focus:ring-[#A7E8D0]"
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between pl-14">
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-sm font-bold text-slate-600 cursor-pointer transition-colors">
                  <ImageIcon size={18} className="text-[#FF8C73]" />
                  {photoFile ? "Photo Added ✅" : "Add Photo"}
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0])} className="hidden" />
                </label>
                
                <select 
                  value={classId} 
                  onChange={e => setClassId(e.target.value)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-sm font-bold text-slate-600 outline-none border-none cursor-pointer"
                >
                  <option value="">School-wide</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={isPosting || !content.trim()} 
                className="btn-primary flex items-center gap-2 py-2 px-6 disabled:opacity-50"
              >
                <Send size={16} /> {isPosting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* The Feed (Visible to everyone) */}
      <div className="space-y-6">
        {activities.map(act => (
          <div key={act.id} className="card-soft overflow-hidden bg-white shadow-sm border border-slate-100">
            
            {/* Header with Delete Button */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center">
                  {act.author_name[0]}
                </div>
                <div>
                  <p className="font-heading font-semibold text-slate-800">{act.author_name}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(act.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} 
                    {act.class_name && ` • ${act.class_name}`}
                  </p>
                </div>
              </div>
              
              {/* Delete Button (Only shows for Admins or the Teacher who wrote the post) */}
              {(user.role === "admin" || user.id === act.author_id) && (
                <button 
                  onClick={() => handleDelete(act.id)} 
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                  title="Delete Post"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Text Content */}
            <div className={`px-4 ${!act.photo_url ? "pb-5" : "pb-3"}`}>
              <p className="text-slate-700 whitespace-pre-wrap">{act.content}</p>
            </div>

            {/* Photo */}
            {act.photo_url && (
              <div className="w-full bg-slate-100 border-t border-slate-100">
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}${act.photo_url}`} 
                  alt="Activity" 
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {activities.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No activities posted yet. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}