import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function Home() {
  const supabase = await createClient()
  const { data: schools } = await supabase
    .from("school_info")
    .select("id, school_name, trust_name, address, logo_url")
    .order("school_name")

  const { data: trusts } = await supabase
    .from("trust_info")
    .select("id, trust_name, address, logo_url, school_id")
    .order("trust_name")

  const primaryTrust = (trusts && trusts.length > 0 ? trusts[0] : null) ||
    (schools && schools.length > 0 ? { trust_name: schools[0].trust_name, address: schools[0].address, logo_url: schools[0].logo_url } : null)

  const list = schools && schools.length > 0 ? schools : [
    {
      id: 1,
      school_name: "The New English School, Vasad",
      trust_name: "THE NEW ENGLISH SCHOOL TRUST, VASAD (ESTD 1942)",
      address: "Vasad, Anand, Gujarat 388306",
      logo_url: "",
    },
    {
      id: 2,
      school_name: "The New English High School (Secondary)",
      trust_name: "THE NEW ENGLISH SCHOOL TRUST, VASAD (ESTD 1942)",
      address: "Vasad, Anand, Gujarat 388306",
      logo_url: "",
    },
    {
      id: 3,
      school_name: "The New English Higher Secondary School (Higher Sec)",
      trust_name: "THE NEW ENGLISH SCHOOL TRUST, VASAD (ESTD 1942)",
      address: "Vasad, Anand, Gujarat 388306",
      logo_url: "",
    },
    {
      id: 4,
      school_name: "The New English Primary School",
      trust_name: "THE NEW ENGLISH SCHOOL TRUST, VASAD (ESTD 1942)",
      address: "Vasad, Anand, Gujarat 388306",
      logo_url: "",
    },
  ]

  const primarySchool = list[0]
  const trustName = primaryTrust?.trust_name || primarySchool?.trust_name || "THE NEW ENGLISH SCHOOL TRUST, VASAD (ESTD 1942)"
  const trustAddress = primaryTrust?.address || primarySchool?.address || "VASAD, ANAND, GUJARAT 388306"

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-slate-800">
      <div className="mx-auto max-w-[1600px] bg-[#f5f4f2] shadow-[0_0_0_1px_rgba(15,23,42,0.05)]">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-[#f6f5f2] px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8 xl:px-12">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#1d4ea1] bg-white shadow-inner">
              {primaryTrust?.logo_url || primarySchool?.logo_url ? (
                <img src={primaryTrust?.logo_url || primarySchool?.logo_url} alt={trustName} className="h-full w-full object-contain p-1" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f0f7ff] text-[2rem] font-black text-[#1d4ea1]">
                  {trustName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-4xl">
                {trustName}
              </h1>
              <p className="mt-1 text-base text-slate-700 md:text-xl">
                {trustAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="text-right">
              <p className="text-xl font-black text-slate-900 md:text-3xl">Central ERP System</p>
              <p className="text-sm text-slate-600 md:text-base">Powered By</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f7d95a] text-4xl font-black text-slate-800 shadow-md md:h-20 md:w-20">
              R
            </div>
            <div className="text-2xl font-black text-[#ff7a00] md:text-4xl">
              Rakesh Thakkar
            </div>
          </div>
        </header>

        <div className="bg-[#dfeaf8] px-4 py-4 md:px-8 xl:px-12">
          <div className="flex justify-end">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#7ecdf7] to-[#90d8f6] px-8 py-4 text-xl font-black text-white shadow-[0_10px_20px_rgba(59,130,246,0.2)] transition hover:brightness-105"
            >
              Organization Portal
            </Link>
          </div>
        </div>

        <section className="px-4 pb-12 pt-8 md:px-8 xl:px-12">
          <h2 className="mb-8 text-center text-3xl font-black text-slate-900 md:text-5xl">
            Select Your Institution / School To Login
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {list.map((school: any, index: number) => {
              const colors = [
                "from-[#dff7ec] to-[#d6f0ff]",
                "from-[#dff7ec] to-[#cfe8ff]",
                "from-[#d8f2ff] to-[#d9e8ff]",
                "from-[#edf3ff] to-[#dfeaff]",
                "from-[#f3ebff] to-[#e9e8ff]",
                "from-[#ecf2ff] to-[#dff4ff]",
              ]

              const title = school.school_name || "School Name"
              const schoolLogo = school.logo_url || primaryTrust?.logo_url

              return (
                <Link
                  key={school.id || index}
                  href={`/login?school_id=${school.id}`}
                  className="group flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#1d4ea1] hover:bg-white hover:shadow-xl cursor-pointer"
                >
                  <div className="flex flex-col items-center w-full">
                    <div className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#1d4ea1] bg-gradient-to-br ${colors[index % colors.length]} p-2 shadow-inner transition duration-300 group-hover:scale-110`}>
                      {schoolLogo ? (
                        <img src={schoolLogo} alt={title} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[2.3rem] font-black text-[#1d4ea1]">
                          {(title || "S").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 text-center text-[1.1rem] font-black text-[#1d4ea1] group-hover:text-blue-600 transition">
                      {title}
                    </div>
                    {school.trust_name && (
                      <div className="mt-1.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        {school.trust_name}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1d4ea1] transition group-hover:bg-[#1d4ea1] group-hover:text-white">
                    Login to School &rarr;
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
