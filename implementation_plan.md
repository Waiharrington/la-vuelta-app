# Reemplazar Ranking por Feed Social Comunitario

La Vuelta Running Club quiere fomentar **comunidad**, no competencia. El leaderboard actual contradice esa filosofía. Vamos a eliminarlo y convertir el feed en el corazón social de la app, con likes y comentarios funcionales.

## Resumen del Cambio

| Antes | Después |
|---|---|
| `/leaderboard` — Ranking competitivo por distancia | **Eliminado** de la navegación |
| Feed con botones de Like/Comentar decorativos (no hacen nada) | **Likes funcionales** con contador en tiempo real |
| Sin sección de comentarios | **Comentarios funcionales** visibles bajo cada actividad |
| Nav con 5 ítems (Inicio, Actividades, Grabar, Ranking, Perfil) | Nav con 4 ítems (Inicio, Actividades, Grabar, Perfil) |

## Propuesta de Cambios

---

### Navegación

#### [MODIFY] [navigation.tsx](file:///c:/Users/Waiha/OneDrive/Desktop/la-vuelta-app/src/components/navigation.tsx)
- Eliminar el ítem `{ href: "/leaderboard", icon: Flame, label: "Ranking" }` del array `navItems`
- Eliminar el import de `Flame` de lucide-react

---

### Feed Social (cambio principal)

#### [MODIFY] [page.tsx](file:///c:/Users/Waiha/OneDrive/Desktop/la-vuelta-app/src/app/feed/page.tsx)
- **Likes funcionales**: El botón de ❤️ ahora:
  - Consulta si el usuario actual ya dio like a cada actividad
  - Al hacer clic: inserta/elimina el like en `lavuelta.likes`
  - Muestra el conteo real de likes
  - Corazón relleno (rojo) si ya diste like, vacío si no
  - Micro-animación al dar like (scale bounce)

- **Comentarios funcionales**: El botón de 💬 ahora:
  - Expande/colapsa una sección de comentarios debajo de la actividad
  - Muestra los comentarios existentes (avatar, nombre, texto, tiempo relativo)
  - Incluye un input para escribir un nuevo comentario
  - Al enviar, se inserta en `lavuelta.comments` y aparece instantáneamente
  - Muestra el conteo real de comentarios

- **Cambiar el header del feed**: Actualizar el copy del hero para reflejar comunidad, no "actividad reciente"

---

### Leaderboard

#### ~~[DELETE] [page.tsx](file:///c:/Users/Waiha/OneDrive/Desktop/la-vuelta-app/src/app/leaderboard/page.tsx)~~ ✅ COMPLETADO
- ~~Eliminar la página de leaderboard completa (ya no se necesita)~~ — Página y directorio eliminados, references removed from middleware, service worker, and PROJECT-HANDOFF.md

---

### Base de Datos

> [!NOTE]
> Las tablas `lavuelta.likes` y `lavuelta.comments` **ya existen** en el schema con las políticas RLS correctas. No se requieren migraciones de base de datos.

---

### Estilos

#### [MODIFY] [globals.css](file:///c:/Users/Waiha/OneDrive/Desktop/la-vuelta-app/src/app/globals.css)
- Añadir animación `like-bounce` para el micro-efecto al dar like
- Añadir estilos para la sección de comentarios expandida

---

## Verificación

### Manual
- Iniciar sesión en `lavuelta-app.vercel.app`
- Verificar que la nav ya no muestra "Ranking"
- Crear una actividad desde `/tracker`
- Dar like → verificar que el corazón se rellena y el contador sube
- Quitar like → verificar que el corazón se vacía y el contador baja
- Escribir un comentario → verificar que aparece al instante
- Verificar que los likes/comentarios persisten al recargar la página

### Build
- `npm run build` para verificar que no hay errores de compilación
