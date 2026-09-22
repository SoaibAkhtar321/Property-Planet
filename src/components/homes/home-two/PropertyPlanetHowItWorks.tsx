// src/components/homes/home-two/PropertyPlanetHowItWorks.tsx
//
// Phase 20 redesign. The section was a floating white band on a white page
// with a styled-jsx block of its own, so it read as a different website.
// It now sits on the existing cream ($color-three) surface with the same
// card shell, orange step markers and dashed connector used elsewhere —
// styles live in _pp-ui.scss (.pp-how) alongside the card styles rather
// than in a component-local <style jsx> block.
//
// No longer a client component: it has no interactivity, so it renders on
// the server and ships no JS.
//
// The four steps describe what the platform actually does today — browse
// published inventory, open a listing, send an enquiry that becomes a lead,
// and get called back by the team. Nothing here claims functionality that
// doesn't exist.

const steps = [
   {
      title: "Explore",
      desc: "Browse curated plots, land, homes and projects across Hyderabad's South-East growth corridors.",
   },
   {
      title: "Choose",
      desc: "Open any listing for pricing, area, locality, media and project details before you commit to anything.",
   },
   {
      title: "Enquire",
      desc: "Send an enquiry from any property or project with just your phone number — add a message or a preferred time if you want to.",
   },
   {
      title: "Connect",
      desc: "Our advisory team calls you back, answers questions and arranges a site visit when you're ready.",
   },
];

const PropertyPlanetHowItWorks = () => {
   return (
      <div className="property-planet-how-it-works pp-band pp-band--peach">
         <div className="container">
            <div className="pp-how">
               <div className="title-one text-center mb-50 lg-mb-40 wow fadeInUp">
                  <h2 className="font-garamond fs-lg">How Property Planet Works</h2>
                  <p className="fs-22 mt-xs">
                     Not just a listing site — a moderated, advisory-backed route from browsing to a
                     real conversation about a real property.
                  </p>
               </div>

               <ol className="pp-how__grid style-none">
                  {steps.map((step, i) => (
                     <li key={step.title} className="pp-how__step wow fadeInUp" data-wow-delay={`0.${i}s`}>
                        <div className="pp-how__num" aria-hidden="true">
                           {String(i + 1).padStart(2, "0")}
                        </div>
                        <h5 className="pp-how__title">{step.title}</h5>
                        <p className="pp-how__desc">{step.desc}</p>
                     </li>
                  ))}
               </ol>
            </div>
         </div>
      </div>
   );
};

export default PropertyPlanetHowItWorks;
