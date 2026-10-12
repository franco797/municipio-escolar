[1mdiff --git a/src/Admin.jsx b/src/Admin.jsx[m
[1mindex b219e39..1088cde 100644[m
[1m--- a/src/Admin.jsx[m
[1m+++ b/src/Admin.jsx[m
[36m@@ -1,5 +1,10 @@[m
 import { useState, useEffect } from "react";[m
 import "./Admin.css";[m
[32m+[m[32mimport Estudiantes from "./Estudiantes";[m
[32m+[m[32mimport ConfiguracionEleccion from "./ConfiguracionEleccion";[m
[32m+[m[32mimport ListasCandidatos from "./ListasCandidatos";[m
[32m+[m
[32m+[m
 [m
 function Admin({[m
   supabase,[m
[36m@@ -272,6 +277,36 @@[m [mfunction Admin({[m
   // =========================[m
   // MENÚ DEL COLEGIO[m
   // =========================[m
[32m+[m[32m  if (pantalla === "estudiantes") {[m
[32m+[m[32m  return ([m
[32m+[m[32m    <Estudiantes[m
[32m+[m[32m      supabase={supabase}[m
[32m+[m[32m      colegio={colegioSeleccionado}[m
[32m+[m[32m      volver={() => setPantalla("menuColegio")}[m
[32m+[m[32m    />[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mif (pantalla === "listas") {[m
[32m+[m[32m  return ([m
[32m+[m[32m    <ListasCandidatos[m
[32m+[m[32m      supabase={supabase}[m
[32m+[m[32m      colegio={colegioSeleccionado}[m
[32m+[m[32m      volver={() => setPantalla("menuColegio")}[m
[32m+[m[32m    />[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[32m+[m[32mif (pantalla === "configuracion") {[m
[32m+[m[32m  return ([m
[32m+[m[32m    <ConfiguracionEleccion[m
[32m+[m[32m      supabase={supabase}[m
[32m+[m[32m      colegio={colegioSeleccionado}[m
[32m+[m[32m      volver={() => setPantalla("menuColegio")}[m
[32m+[m[32m    />[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[32m+[m
[32m+[m
   if (pantalla === "menuColegio") {[m
     return ([m
       <div className="admin-container">[m
[36m@@ -287,21 +322,32 @@[m [mfunction Admin({[m
 [m
           <div className="admin-actions">[m
 [m
[31m-            <button className="admin-btn-primary">[m
[31m-              VER ESTUDIANTES[m
[31m-            </button>[m
[32m+[m[41m            [m
[32m+[m[32m<button[m
[32m+[m[32m  className="admin-btn-primary"[m
[32m+[m[32m  onClick={() => setPantalla("estudiantes")}[m
[32m+[m[32m>[m
[32m+[m[32m  VER ESTUDIANTES[m
[32m+[m[32m</button>[m
 [m
[31m-            <button className="admin-btn-primary">[m
[31m-              VER LISTAS Y CANDIDATOS[m
[31m-            </button>[m
[32m+[m
[32m+[m[32m            <button[m
[32m+[m[32m  className="admin-btn-primary"[m
[32m+[m[32m  onClick={() => setPantalla("listas")}[m
[32m+[m[32m>[m
[32m+[m[32m  VER LISTAS Y CANDIDATOS[m
[32m+[m[32m</button>[m
 [m
             <button className="admin-btn-primary">[m
               VER RESULTADOS[m
             </button>[m
 [m
[31m-            <button className="admin-btn-primary">[m
[31m-              CONFIGURAR ELECCIÓN[m
[31m-            </button>[m
[32m+[m[32m            <button[m
[32m+[m[32m  className="admin-btn-primary"[m
[32m+[m[32m  onClick={() => setPantalla("configuracion")}[m
[32m+[m[32m>[m
[32m+[m[32m  CONFIGURAR ELECCIÓN[m
[32m+[m[32m</button>[m
 [m
           </div>[m
 [m
