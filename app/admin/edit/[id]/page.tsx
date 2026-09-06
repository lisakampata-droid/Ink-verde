'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Editor, { InitialArticle } from '../../new/Editor'
import { supabase } from '@/lib/supabase'

export default function EditStoryPage(){
  const params=useParams<{id:string}>(); const router=useRouter(); const [article,setArticle]=useState<InitialArticle|null>(null)
  useEffect(()=>{(async()=>{const {data:{session}}=await supabase.auth.getSession(); if(!session){router.replace('/admin/login');return} const {data:editor}=await supabase.from('editor_users').select('user_id').eq('user_id',session.user.id).maybeSingle(); if(!editor){router.replace('/admin/login');return} const {data,error}=await supabase.from('articles').select('id,title,dek,category,body,author,read_time,featured_image,status').eq('id',params.id).single(); if(error||!data){router.replace('/admin');return} setArticle(data as InitialArticle)})()},[params.id,router])
  if(!article) return <main className="min-h-screen bg-[#eeeae1] grid place-items-center text-sm text-black/50">Loading story…</main>
  return <Editor initialArticle={article}/>
}
