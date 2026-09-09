import { Project } from "./types";

// Only one project is confirmed today. No fictional projects are added here —
// per project decision, an honest, smaller dataset is preferred over fake
// inventory. Do not invent RERA numbers, approvals, pricing, possession
// dates, distances, amenities, or other unverified specifics.

const demoProjects: Project[] = [
   {
      id: "property-planet",
      slug: "property-planet",
      title: "Property Planet",
      tag: "Plotted Development",
      developer: "Elite Infra Group",
      location: "Kongara Khurd-A, South Hyderabad",
      projectType: "17-acre plotted development",
      images: [
         "/assets/images/project/img_01.jpg",
         "/assets/images/project/img_02.jpg",
         "/assets/images/project/img_03.jpg",
      ],
   },
];

export default demoProjects;
