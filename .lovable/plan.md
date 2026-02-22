
# Media Hub — Team Media Management App

## Overview
A clean, minimal web app where team members can upload, organize, and manage shared media files (images & videos) in a collaborative workspace.

## 1. Authentication
- **Sign up / Login / Logout** with email and password via Supabase Auth
- User profiles with display name and avatar
- Protected routes — unauthenticated users redirected to login

## 2. Dashboard
- Clean landing page showing recent uploads across the team
- Top navigation bar with search, user menu, and upload button
- Sidebar with folder tree navigation

## 3. Folder System
- Create, rename, and delete folders
- Nested folder support with breadcrumb navigation
- Folder view shows all media inside with file count
- All team members can see and manage shared folders

## 4. Media Upload
- Drag-and-drop upload zone + file picker button
- Supported formats: JPG, PNG, WebP (images), MP4, MOV, WebM (videos)
- File size validation up to 500 MB
- Upload progress indicator
- Each file requires a title and optional description
- Upload date auto-generated

## 5. Media Library & Grid View
- Responsive grid layout with thumbnail previews
- Video thumbnails with play icon overlay
- Toggle between grid and list view
- Sort by date, name, or file size
- Search by title or filter by folder

## 6. Media Preview & Playback
- Click to open full-size image preview in a modal/lightbox
- Built-in video player for video files
- Display file details: title, description, upload date, uploader, file size

## 7. Media Management
- Edit title and description inline
- Delete files with confirmation dialog
- Move files between folders

## 8. Design & UX
- Clean, minimal design with lots of white space (Google Drive-inspired)
- Light theme with subtle shadows and borders
- Responsive layout — works on desktop, tablet, and mobile
- Smooth animations and loading states

## Backend (Supabase)
- **Auth**: Supabase Auth for email/password authentication
- **Database**: Tables for profiles, folders, and media metadata
- **Storage**: Supabase Storage bucket for file uploads (public bucket for team access)
- **RLS**: Row-level security ensuring only authenticated team members can access data
