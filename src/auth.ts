import 'server-only';

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true, // Trust localhost and other hosts in development
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  session: { 
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes - session expires after 15 minutes
    updateAge: 60, // Update session every 60 seconds when user is active (to reset the 15-minute timer)
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // NextAuth يستخدم maxAge من session.maxAge تلقائياً للكوكيز
        // لجعل الكوكيز session-only (تختفي عند إغلاق المتصفح)،
        // نحتاج إلى عدم وضع maxAge في cookie options
        // لكن NextAuth يضيفه تلقائياً، لذلك سنستخدم callback لتعديل الكوكيز
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  pages: {
    signIn: '/login', // تحديد صفحة الـ login
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = (creds?.email || "").toString().trim();
        const password = (creds?.password || "").toString();

        if (!email || !password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          // التحقق من الاتصال بقاعدة البيانات أولاً
          await prisma.$connect();
          
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: 'insensitive',
              },
              isActive: true,
            },
            select: {
              userId: true,
              username: true,
              email: true,
              password: true,
              roleId: true,
              isAdmin: true,
            },
          });
          
          if (!user) {
            console.log(`❌ User not found or inactive: ${email}`);
            // محاولة البحث بدون شرط isActive للتحقق
            const inactiveUser = await prisma.user.findFirst({
              where: {
                email: {
                  equals: email,
                  mode: 'insensitive',
                },
              },
              select: {
                userId: true,
                username: true,
                email: true,
                isActive: true,
              },
            });
            if (inactiveUser) {
              console.log(`⚠️ User found but inactive: ${email}, isActive: ${inactiveUser.isActive}`);
            }
            return null;
          }

          // التحقق من كلمة المرور
          const ok = await bcrypt.compare(password, user.password);
          
          if (!ok) {
            console.log(`❌ Password mismatch for user: ${email}`);
            return null;
          }

          const userSession = {
            id: String(user.userId),
            name: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            roleId: user.roleId,
          };

          console.log(`✅ Authentication successful for user: ${email}`);
          return userSession as any;

        } catch (err: any) {
          // تسجيل الأخطاء بشكل مفصل
          console.error("❌ Authorization error:", {
            message: err.message,
            stack: err.stack,
            name: err.name,
          });
          return null;
        }
      },
    }),
  ],
  jwt: {
    maxAge: 15 * 60, // 15 minutes to match session maxAge
  },
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      if (user) {
        token.id = (user as any).id; // ✅ إضافة id للـ token
        token.userId = (user as any).id;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.roleId = (user as any).roleId ?? 0;
        token.isGuest = (user as any).isGuest ?? false;
      }
      
      // NextAuth يدير انتهاء الجلسة تلقائياً بناءً على maxAge
      // updateAge يقوم بتحديث الجلسة كل 60 ثانية عند التفاعل
      // إذا لم يكن هناك تفاعل لمدة 15 دقيقة، الجلسة ستنتهي تلقائياً
      
      return token;
    },
    async session({ session, token }) {
      // Session callback يتم استدعاؤه بشكل متكرر - لا نضع console logs هنا
      session.user = {
        id: String((token as any).id ?? (token as any).userId ?? ""),
        userId: Number((token as any).userId ?? (token as any).id ?? 0),    //  ← إضافة userId في الجلسة أيضًا
        name: session.user?.name || "",
        email: session.user?.email || "",
        isAdmin: Boolean((token as any).isAdmin),
        roleId: Number((token as any).roleId ?? 0),
      } as any;
      
      return session;
    },
  },
  debug: false, // تعطيل debug logs لتجنب التكرار المفرط
});

export { GET as GETAuth, POST as POSTAuth };