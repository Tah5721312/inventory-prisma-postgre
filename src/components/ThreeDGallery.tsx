"use client"; // إذا كنت في Next.js 13 أو أعلى وتستخدم app router

import React from "react";
import styles from "./ThreeDGallery.module.css"; // استيراد CSS module

const ThreeDGallery: React.FC = () => {
  return (
    <div className={styles.galleryContainer}>
      <div className={styles.gallery}>
        <div
          className={styles.image}
          style={{ backgroundImage: "url('/3dimage.png')" }}
        ></div>
        <div
          className={styles.image}
          style={{ backgroundImage: "url('/3dimage2.png')" }}
        ></div>
        <div
          className={styles.image}
          style={{ backgroundImage: "url('/3dimage3.png')" }}
        ></div>
        {/* لإضافة صور لاحقًا */}
        {/* <div className={styles.image} style={{ backgroundImage: "url('/4.jpg')" }}></div>
        <div className={styles.image} style={{ backgroundImage: "url('/5.jpg')" }}></div> */}
      </div>
    </div>
  );
};

export default ThreeDGallery;
