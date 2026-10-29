"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

const HeaderSearchbar = ({ isSearch, setIsSearch }: any) => {

   const [searchValue, setSearchValue] = useState("");
   const router = useRouter();

   const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
   };

   // Previously this only cleared the box and closed the modal -- it never
   // searched. It now opens /properties with the text as `q`, which the AI
   // search layer interprets (src/lib/ai/search.ts).
   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchValue.trim().slice(0, 200);
      setSearchValue('');
      setIsSearch(false);
      router.push(q ? `/properties?q=${encodeURIComponent(q)}` : "/properties");
   };

   return (
      <>
         <div className={`modal fade search-modal ${isSearch ? "active" : ""}`} id="searchModal">
            <div className="modal-dialog modal-fullscreen modal-dialog-centered">
               <div className="modal-content d-flex justify-content-center">
                  <form onSubmit={handleSubmit}>
                     <input value={searchValue} onChange={handleSearchChange} type="search" maxLength={200} aria-label="Search properties" placeholder="Try: plot in Shadnagar under 50 lakh" />
                     <button type="submit" aria-label="Search"><i className="fa-light fa-arrow-right-long"></i></button>
                  </form>
               </div>
            </div>
         </div>
         <div onClick={() => setIsSearch(false)} className={`search-backdrop modal-backdrop fade ${isSearch ? "show" : ""}`}></div>
      </>
   )
}

export default HeaderSearchbar
