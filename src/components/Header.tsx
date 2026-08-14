import React, { useEffect, useState } from 'react';
import { MapPin, Siren, Sparkles, UserRound, Wrench } from 'lucide-react';
import { CategoryId, CATEGORIES } from '../types';
import { subscribeToAuth } from '../auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from 'firebase/auth';

interface HeaderProps { searchQuery:string; setSearchQuery:(q:string)=>void; selectedCategory:CategoryId|'all'; setSelectedCategory:(c:CategoryId|'all')=>void; selectedSubcategory?:string|null; setSelectedSubcategory?:(s:string|null)=>void; isNearMeActive:boolean; setIsNearMeActive:(a:boolean)=>void; urgentCount:number; totalListingsCount:number; }

const MAIN_CATEGORY_IDS: CategoryId[] = ['service','rideshare','sale','buy','rent','giveaway','other'];

export const Header: React.FC<HeaderProps> = ({selectedCategory,setSelectedCategory,selectedSubcategory,setSelectedSubcategory,isNearMeActive,setIsNearMeActive,urgentCount,totalListingsCount}) => {
 const currentCategoryInfo=selectedCategory!=='all'?CATEGORIES[selectedCategory]:null;
 const subcategories=currentCategoryInfo?.subcategories??[];
 const [user,setUser]=useState<User|null>(null);
 const [profilePhoto,setProfilePhoto]=useState('');

 useEffect(()=>{
   let stopProfile:(()=>void)|null=null;
   const stopAuth=subscribeToAuth(u=>{
     setUser(u); setProfilePhoto(''); stopProfile?.(); stopProfile=null;
     if(!u) return;
     stopProfile=onSnapshot(doc(db,'users',u.uid),snap=>{
       const data=snap.exists()?snap.data():{};
       const custom=typeof data.photo==='string'?data.photo:'';
       setProfilePhoto(custom || u.photoURL || '');
     },()=>setProfilePhoto(u.photoURL || ''));
   });
   return ()=>{stopProfile?.();stopAuth();};
 },[]);

 return <header className="sticky top-0 z-[1000] border-b border-yellow-400/20 bg-slate-950/95 px-2 py-1 shadow-xl backdrop-blur-xl sm:px-4">
  <div className="mx-auto w-full max-w-6xl">
   <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-gradient-to-b from-slate-900 to-slate-950 px-3 py-1.5 shadow-lg">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-yellow-400/70"/>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-yellow-400/50"/>
    <div className="pointer-events-none absolute left-0 top-0 h-full w-24 opacity-70" style={{backgroundImage:'repeating-linear-gradient(45deg,transparent 0 6px,rgba(250,204,21,.35) 6px 8px,transparent 8px 14px)'}}/>
    <div className="pointer-events-none absolute right-0 top-0 h-full w-24 opacity-70" style={{backgroundImage:'repeating-linear-gradient(-45deg,transparent 0 6px,rgba(250,204,21,.35) 6px 8px,transparent 8px 14px)'}}/>
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
       <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-yellow-400/70 bg-slate-800 shadow-lg">
        {profilePhoto?<img src={profilePhoto} alt="Гість" className="h-full w-full object-cover"/>:<UserRound className="h-4 w-4 text-yellow-300"/>}
        <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-slate-950 ${user?'bg-emerald-400':'bg-slate-500'}`}/>
       </div>
       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-blue-500 via-blue-600 to-yellow-400 text-slate-950 shadow-lg"><Wrench className="h-4 w-4"/></div>
       <div className="min-w-0">
        <div className="flex items-center gap-1"><Sparkles className="h-3 w-3 shrink-0 text-yellow-300"/><h1 className="truncate text-[15px] font-black tracking-[.12em] text-white">МАЙСТЕР <span className="text-yellow-400">ОНЛАЙН</span></h1></div>
        <div className="flex items-center gap-1 text-[8px] font-bold text-blue-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400"/><span>Гість</span><span className="text-slate-500">• {totalListingsCount} оголошень</span></div>
       </div>
      </div>
      <button type="button" onClick={()=>setIsNearMeActive(!isNearMeActive)} aria-label="Показати поруч зі мною" className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-extrabold ${isNearMeActive?'border-yellow-300 bg-yellow-400 text-slate-950':'border-blue-400/20 bg-blue-500/10 text-slate-200'}`}><MapPin className="h-3 w-3"/><span>Поруч</span></button>
    </div>
   </div>
   <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
    <button type="button" onClick={()=>{setSelectedCategory('all');setSelectedSubcategory?.(null)}} className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-extrabold ${selectedCategory==='all'?'border-yellow-300 bg-yellow-400 text-slate-950':'border-blue-400/20 bg-blue-500/10 text-slate-300'}`}>Усе</button>
    <button type="button" onClick={()=>{setSelectedCategory(selectedCategory==='urgent'?'all':'urgent');setSelectedSubcategory?.(null)}} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-black ${selectedCategory==='urgent'?'border-rose-300 bg-rose-600 text-white':'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}><Siren className="h-3.5 w-3.5"/>Терміново{urgentCount>0&&<span className="rounded-full bg-rose-900 px-1.5 text-white">{urgentCount}</span>}</button>
    {MAIN_CATEGORY_IDS.map(catKey=>{const cat=CATEGORIES[catKey];const selected=selectedCategory===catKey;return <button key={catKey} type="button" onClick={()=>{setSelectedCategory(selected?'all':catKey);setSelectedSubcategory?.(null)}} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold ${selected?'border-yellow-300 bg-gradient-to-r from-blue-600 to-yellow-400 text-white':'border-blue-400/20 bg-blue-500/10 text-slate-300'}`}><span>{cat.pinSymbol}</span>{cat.shortLabel}</button>})}
   </div>
   {subcategories.length>0&&selectedCategory!=='urgent'&&<div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-blue-400/10 pt-1"><span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Підкатегорії</span><button type="button" onClick={()=>setSelectedSubcategory?.(null)} className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold ${!selectedSubcategory?'border-yellow-300 bg-yellow-400 text-slate-950':'border-blue-400/20 bg-blue-500/10 text-slate-300'}`}>Усі</button>{subcategories.map(sub=><button key={sub} type="button" onClick={()=>setSelectedSubcategory?.(selectedSubcategory===sub?null:sub)} className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${selectedSubcategory===sub?'border-yellow-300 bg-yellow-400 text-slate-950':'border-blue-400/20 bg-blue-500/10 text-slate-300'}`}>{sub}</button>)}</div>}
  </div>
 </header>;
};
