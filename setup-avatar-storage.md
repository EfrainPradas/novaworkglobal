# Setup Avatar Storage in Supabase

Follow these steps to enable avatar uploads:

## 1. Create Storage Bucket

Go to your Supabase Dashboard > Storage and create a new bucket:

- **Name**: `avatars`
- **Public**: Yes (check "Public bucket")
- **File size limit**: 2MB
- **Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp

## 2. Set Storage Policies

Go to Storage > Policies for the `avatars` bucket and add these policies:

### Policy 1: Enable Read Access (Public)
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );
```

### Policy 2: Enable Upload for Authenticated Users
```sql
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

### Policy 3: Enable Update for Own Avatars
```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

### Policy 4: Enable Delete for Own Avatars
```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
);
```

## 3. Alternative: Quick Setup via UI

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name it `avatars`
4. Check **Public bucket**
5. Click **Create bucket**
6. Click on the bucket name
7. Go to **Policies** tab
8. Click **New Policy**
9. Choose template: **Allow public read access**
10. Add another policy: **Allow authenticated users to upload**

## 4. Test the Upload

1. Go to http://localhost:5173/carreertips/resume-builder/profile
2. Click on your avatar or "Change Photo"
3. Select an image (JPG, PNG, or GIF, max 2MB)
4. The avatar should upload and appear in the menu

## Troubleshooting

If you get an error saying "bucket not found":
- Make sure the bucket is named exactly `avatars` (lowercase, plural)
- Verify it's set as a public bucket
- Check that the policies are correctly applied

If uploads fail:
- Check browser console for detailed error messages
- Verify your Supabase URL and anon key are correct in `.env`
- Ensure you're authenticated (logged in)
