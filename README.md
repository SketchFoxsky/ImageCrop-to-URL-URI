# 📷 Image to Link Cropper (16:9)

This tool lets you import an image, crop or fit it into a **16:9 frame**, and export it as a **1280×720 PNG**.  
It also includes a local **export library** where you can save and manage previous exports.  

---

## ✨ Features
- **Crop Mode**: Drag or resize a 16:9 mask to crop exactly what you want.  
- **Fit to Frame Mode**: Automatically fits the entire image into a 16:9 frame with black bars.  
- **Forced Export Size**: All exports are **1280×720**, regardless of the input image size.  
- **Handles & Dragging**: Move and resize the crop mask (corners + edges), always locked to 16:9.  
- **Clipboard Support**: Copy the exported image link directly.  
- **Catbox Upload Flow**: Copies the image to clipboard and opens [catbox.moe](https://catbox.moe) for easy upload.  
- **Export Library**: Automatically saves all exports locally. You can browse, copy, replace, or delete them later.  
- **Import / Export Library**: Share your saved exports by exporting them to a `.json` file.  

---

## 🚀 How to Use

1. **Import an Image**  
   - Click *Choose File* and select an image.  
   - Large images (>4096px) are automatically resized to fit within **4096×4096**.  

2. **Choose Mode**  
   - `Crop`: Drag or resize the red mask (16:9 locked) over your image.  
   - `Fit to Frame`: Automatically fits the image inside 16:9 with black bars.  

3. **Adjust the Mask (Crop Mode)**  
   - Click and drag inside the mask to move it.  
   - Drag handles on corners/edges to resize.  
   - Mask always stays within the image and keeps a 16:9 ratio.  

4. **Export Options**  
   - **Preview Export** → See the 1280×720 result.  
   - **Download PNG** → Save the cropped image locally.  
   - **Copy Image Link** → Copies a base64 image link to clipboard.  
   - **Upload to Catbox** → Copies the PNG to clipboard and opens Catbox for upload.  

5. **Library**  
   - Every export is saved in the built-in library (stored in your browser).  
   - From here, you can:
     - Copy the link  
     - Download  
     - Open in new tab  
     - Replace with a Catbox link  
     - Delete  
   - Use **Export Library** to save everything to a `.json` file, and **Import Library** to load it later.  

---

## ⚠️ Notes
- Base64 exports can be very large. Catbox links are recommended for sharing.  
- Local storage is limited (~5 MB). The tool will automatically clean old entries if you go over the limit.  
- Exported images are **always 1280×720**, even if your source image is larger or smaller.  
