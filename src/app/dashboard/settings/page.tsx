"use client";

import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import { Save, Instagram, Youtube, Twitter } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { data: profile, isLoading } = api.coaches.getCoachProfile.useQuery();
  const utils = api.useUtils();
  
  const updateProfile = api.coaches.updateCoachProfile.useMutation({
    onSuccess: () => {
      utils.coaches.getCoachProfile.invalidate();
      alert("Profile updated successfully!");
    },
  });

  const [formData, setFormData] = useState({
    bio: "",
    specialties: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  });

  useEffect(() => {
    if (profile) {
      const social = profile.socialMediaLinks as any || {};
      setFormData({
        bio: profile.bio || "",
        specialties: (profile.specialties as string[] || []).join(", "),
        instagram: social.instagram || "",
        youtube: social.youtube || "",
        tiktok: social.tiktok || "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      bio: formData.bio,
      specialties: formData.specialties.split(",").map(s => s.trim()).filter(Boolean),
      socialMediaLinks: {
        instagram: formData.instagram,
        youtube: formData.youtube,
        tiktok: formData.tiktok,
      },
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="font-heading text-3xl font-bold uppercase tracking-tighter">Coach Settings</h2>
        <p className="text-muted-foreground">Manage your public profile and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Section */}
        <div className="border border-border bg-card p-6">
          <h3 className="mb-6 font-heading text-xl font-bold uppercase">Public Profile</h3>
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="h-32 w-full border border-border bg-secondary p-3 text-sm focus:border-primary focus:outline-none"
                placeholder="Tell your story..."
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">Specialties (Comma separated)</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                className="w-full border border-border bg-secondary p-3 text-sm focus:border-primary focus:outline-none"
                placeholder="Weight Loss, HIIT, Strength..."
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border border-border bg-card p-6">
          <h3 className="mb-6 font-heading text-xl font-bold uppercase">Social Connections</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                <Instagram className="h-4 w-4" /> Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full border border-border bg-secondary p-3 text-sm focus:border-primary focus:outline-none"
                placeholder="@username"
              />
            </div>
            
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                <Youtube className="h-4 w-4" /> YouTube
              </label>
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="w-full border border-border bg-secondary p-3 text-sm focus:border-primary focus:outline-none"
                placeholder="Channel URL"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                <span className="font-bold">TikTok</span>
              </label>
              <input
                type="text"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                className="w-full border border-border bg-secondary p-3 text-sm focus:border-primary focus:outline-none"
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 bg-primary px-8 py-3 text-sm font-bold uppercase text-primary-foreground transition-transform hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
