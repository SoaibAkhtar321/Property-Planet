"use client"

const sellerTypes = ["Landowner", "Developer", "Property Owner", "Agent", "Company"];
const propertyTypes = ["Plot", "Land", "Villa", "Apartment", "Commercial", "Corporate Land"];
const purposes = ["Sell", "Developer Partnership", "Corporate Sale", "Investment Opportunity"];

const SellPropertyArea = () => {
   const handleSubmit = (e: React.FormEvent) => {
      // Seller submission is not available yet — this flow is implemented
      // in a later phase. Prevent the native form post; do not claim the
      // property was submitted or that any data was persisted.
      e.preventDefault();
   }

   return (
      <div className="sell-property-area position-relative z-1 pt-200 md-pt-150 pb-150 xl-pb-120">
         <div className="container">
            <div className="row justify-content-center">
               <div className="col-xl-8 col-lg-9">
                  <div className="title-one text-center mb-20 wow fadeInUp">
                     <h2 className="font-garamond">Sell Through Property Planet</h2>
                     <p className="fs-22 mt-xs">Submit your land or property. Our team reviews the opportunity and connects it with relevant buyers, developers or companies — you don&apos;t get exposed directly to buyers.</p>
                  </div>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="sell-form wow fadeInUp mt-50 lg-mt-30">
               <div className="row">
                  <div className="col-12">
                     <h6 className="form-section-title">Seller Information</h6>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Name*</label>
                        <input type="text" placeholder="Your full name" required />
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Phone*</label>
                        <input type="tel" placeholder="Phone number" required />
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Email*</label>
                        <input type="email" placeholder="Email address" required />
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Seller Type*</label>
                        <select required defaultValue="">
                           <option value="" disabled>Select seller type</option>
                           {sellerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="col-12 mt-10">
                     <h6 className="form-section-title">Property Information</h6>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Property Type*</label>
                        <select required defaultValue="">
                           <option value="" disabled>Select property type</option>
                           {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Location*</label>
                        <input type="text" placeholder="e.g. Mucherla, Hyderabad" required />
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Area*</label>
                        <input type="text" placeholder="e.g. 1,800 sq.yd or 6 acres" required />
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Expected Price*</label>
                        <input type="text" placeholder="e.g. ₹98 Lakh" required />
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Purpose*</label>
                        <select required defaultValue="">
                           <option value="" disabled>Select purpose</option>
                           {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="col-12">
                     <div className="input-group-meta form-group mb-30">
                        <label>Description</label>
                        <textarea placeholder="Tell us more about the property"></textarea>
                     </div>
                  </div>

                  <div className="col-12 mt-10">
                     <h6 className="form-section-title">Documents &amp; Images</h6>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Upload Documents</label>
                        <input type="file" multiple />
                        <span className="fs-12 opacity-65 d-block mt-1">Prototype only — files are not uploaded or stored.</span>
                     </div>
                  </div>
                  <div className="col-md-6">
                     <div className="input-group-meta form-group mb-30">
                        <label>Upload Images</label>
                        <input type="file" multiple accept="image/*" />
                        <span className="fs-12 opacity-65 d-block mt-1">Prototype only — files are not uploaded or stored.</span>
                     </div>
                  </div>

                  <div className="col-12 mt-20">
                     <button type="submit" disabled className="btn-nine text-uppercase rounded-3 fw-normal w-100">
                        Coming Soon — Submissions Not Yet Open
                     </button>
                     <span className="fs-12 opacity-65 d-block mt-2">This form is a preview. Property submission isn&apos;t available yet — check back soon.</span>
                  </div>
               </div>
            </form>
         </div>

         <style jsx>{`
            .form-section-title {
               font-size: 13px;
               letter-spacing: 1px;
               text-transform: uppercase;
               color: #8a6d2f;
               margin-bottom: 18px;
               padding-bottom: 10px;
               border-bottom: 1px solid #ecebe3;
            }
            .sell-form select,
            .sell-form textarea {
               width: 100%;
               border: 1px solid #e4e1d4;
               border-radius: 6px;
               padding: 12px 14px;
               font-size: 14px;
               background: #fff;
            }
            .sell-form textarea {
               min-height: 120px;
            }
            .sell-form input[type="file"] {
               width: 100%;
               border: 1px dashed #e4e1d4;
               border-radius: 6px;
               padding: 10px 12px;
               font-size: 13px;
               background: #faf9f4;
            }
         `}</style>
      </div>
   )
}

export default SellPropertyArea
