# Property Planet 🏡

![Repo size](https://img.shields.io/github/repo-size/SoaibAkhtar321/Property-Planet?style=for-the-badge)
![Last commit](https://img.shields.io/github/last-commit/SoaibAkhtar321/Property-Planet?style=for-the-badge)
![Contributors](https://img.shields.io/github/contributors/SoaibAkhtar321/Property-Planet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Sass](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)

## 🌟 Overview
🔗 **Live:** [propertyplanet.vercel.app](https://propertyplanet.vercel.app/)
**Property Planet** is a real estate platform for buying, selling and discovering plotted developments and projects across South Hyderabad. Listings and projects go through admin review before they go live, and enquiries are routed directly between buyers, sellers and the Property Planet team — no platform middlemen, and **no payments are collected on the platform itself.**

## 🎯 Features
- 🔍 **Verified listings & projects** — every listing is reviewed by the admin team before it goes live
- 🏠 **Property & project browsing** with location, budget, size and type filters
- ✉️ **Direct enquiries** sent straight from a listing or project page
- 📅 **Site visit scheduling** and enquiry tracking from a buyer dashboard
- 🧑‍💼 **Seller tools** to list, manage and track properties
- 🛠️ **Admin dashboard** for reviewing/approving listings and projects
- 🗺️ **Interactive locality map** (Leaflet + OpenStreetMap) and Google Maps embeds on detail pages
- 🎨 **Fully responsive** across desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Sass/SCSS** & **Bootstrap 5** (styling)
- **Redux Toolkit** (state)
- **React Hook Form + Yup** (forms & validation)
- **React Slick**, **React Toastify**

### Data & Maps
- **Supabase** (Postgres, Auth, Storage)
- **Leaflet / React-Leaflet** + Google Maps embed
- **Chart.js** (dashboard analytics)

## 📂 Project Structure
```
Property-Planet/
├── public/                  # Static assets, compiled scss entry points
├── src/
│   ├── app/                 # Next.js App Router pages (home, properties,
│   │                          projects, dashboard, admin, seller, auth, ...)
│   ├── components/          # UI components grouped by page/section
│   ├── data/                # Static/content data used across pages
│   ├── hooks/
│   ├── layouts/             # Header/footer layout variants
│   ├── lib/                 # Supabase clients, shared config
│   ├── modals/
│   ├── redux/
│   ├── styles/
│   ├── types/
│   └── utils/
├── supabase/                # Supabase migrations/config
├── .env.example
├── next.config.js
└── package.json
```

## 📌 Notes
Property Planet is a technology and facilitation platform. Buyers should independently verify original title documents and legal status before any transaction. All payments are made directly between buyer and seller — the platform does not process or hold payments.

## 🔒 Ownership
This repository is private and is the property of its owner. It is not open source and is not licensed for reuse, redistribution or modification by third parties.
