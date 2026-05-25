-- Supabase SQL schema for School ERP

-- Enable RLS (enabled by default in Supabase)
alter table students enable row level security;
alter table teachers enable row level security;
alter table fees enable row level security;
alter table attendance enable row level security;
alter table exams enable row level security;
alter table marks enable row level security;

-- Permissive RLS policies for development/demo (allow anon key full access)
do $$ begin
  create policy allow_all on students for all using (true) with check (true);
  exception when duplicate_object then null;
  end $$;
  do $$ begin
    create policy allow_all on teachers for all using (true) with check (true);
    exception when duplicate_object then null;
    end $$;
    do $$ begin
      create policy allow_all on fees for all using (true) with check (true);
      exception when duplicate_object then null;
      end $$;
      do $$ begin
        create policy allow_all on attendance for all using (true) with check (true);
        exception when duplicate_object then null;
        end $$;
        do $$ begin
          create policy allow_all on exams for all using (true) with check (true);
          exception when duplicate_object then null;
          end $$;
          do $$ begin
            create policy allow_all on marks for all using (true) with check (true);
            exception when duplicate_object then null;
            end $$;

            -- Add new columns if table already exists
            alter table students add column if not exists father_name text;
            alter table students add column if not exists mother_name text;
            alter table students add column if not exists birthplace text;
            alter table students add column if not exists village text;
            alter table students add column if not exists district text;
            alter table students add column if not exists division text;

            create table if not exists students (
              id bigint generated always as identity primary key,
                admission_no text,
                  full_name text,
                    gender text,
                      father_name text,
                        mother_name text,
                          dob date,
                            birthplace text,
                              mobile text,
                                address text,
                                  village text,
                                    district text,
                                      division text,
                                        class_name text,
                                          created_at timestamp default now()
                                          );

                                          create table if not exists teachers (
                                            id bigint generated always as identity primary key,
                                              full_name text,
                                                subject text,
                                                  mobile text,
                                                    salary numeric,
                                                      created_at timestamp default now()
                                                      );

                                                      create table if not exists fees (
                                                        id bigint generated always as identity primary key,
                                                          student_id bigint references students(id) on delete cascade,
                                                            amount numeric,
                                                              status text,
                                                                payment_date timestamp,
                                                                  created_at timestamp default now()
                                                                  );

                                                                  create table if not exists attendance (
                                                                    id bigint generated always as identity primary key,
                                                                      student_id bigint references students(id) on delete cascade,
                                                                        attendance_date date,
                                                                          status text,
                                                                            created_at timestamp default now()
                                                                            );

                                                                            create table if not exists exams (
                                                                              id bigint generated always as identity primary key,
                                                                                exam_name text,
                                                                                  class_name text,
                                                                                    created_at timestamp default now()
                                                                                    );

                                                                                    create table if not exists marks (
                                                                                      id bigint generated always as identity primary key,
                                                                                        student_id bigint references students(id) on delete cascade,
                                                                                          exam_id bigint references exams(id) on delete cascade,
                                                                                            subject text,
                                                                                              marks numeric
                                                                                              );

                                                                                              create table if not exists school_info (
                                                                                                id bigint generated always as identity primary key,
                                                                                                  school_name text,
                                                                                                    address text,
                                                                                                      phone text,
                                                                                                        email text,
                                                                                                          website text,
                                                                                                            principal_name text,
                                                                                                              affiliation text,
                                                                                                                logo_url text,
                                                                                                                  updated_at timestamp default now()
                                                                                                                  );

                                                                                                                  alter table school_info enable row level security;
                                                                                                                  do $$ begin
                                                                                                                    create policy allow_all on school_info for all using (true) with check (true);
                                                                                                                    exception when duplicate_object then null;
                                                                                                                    end $$;

                                                                                                                    create table if not exists subjects (
                                                                                                                      id bigint generated always as identity primary key,
                                                                                                                        class_name text not null,
                                                                                                                          subject_name text not null,
                                                                                                                            created_at timestamp default now()
                                                                                                                            );

                                                                                                                            alter table subjects enable row level security;
                                                                                                                            do $$ begin
                                                                                                                              create policy allow_all on subjects for all using (true) with check (true);
                                                                                                                              exception when duplicate_object then null;
                                                                                                                              end $$;

                                                                                                                              create table if not exists academic_years (
                                                                                                                                id bigint generated always as identity primary key,
                                                                                                                                  year_name text not null,
                                                                                                                                    start_date date,
                                                                                                                                      end_date date,
                                                                                                                                        is_active boolean default false,
                                                                                                                                          created_at timestamp default now()
                                                                                                                                          );

                                                                                                                                          alter table academic_years enable row level security;
                                                                                                                                          do $$ begin
                                                                                                                                            create policy allow_all on academic_years for all using (true) with check (true);
                                                                                                                                            exception when duplicate_object then null;
                                                                                                                                            end $$;

                                                                                                                                            create table if not exists divisions (
                                                                                                                                              id bigint generated always as identity primary key,
                                                                                                                                                class_name text not null,
                                                                                                                                                  division_name text not null,
                                                                                                                                                    created_at timestamp default now()
                                                                                                                                                    );

alter table divisions add column if not exists class_teacher_id bigint references teachers(id);

                                                                                                                                                      alter table divisions enable row level security;
                                                                                                                                                    do $$ begin
                                                                                                                                                      create policy allow_all on divisions for all using (true) with check (true);
                                                                                                                                                      exception when duplicate_object then null;
                                                                                                                                                      end $$;

                                                                                                                                                      alter table students add column if not exists academic_year_id bigint references academic_years(id);
                                                                                                                                                      create table if not exists streams (
  id bigint generated always as identity primary key,
  class_name text not null,
  stream_name text not null,
  created_at timestamp default now()
);

alter table streams enable row level security;
do $$ begin
  create policy allow_all on streams for all using (true) with check (true);
  exception when duplicate_object then null;
end $$;

alter table students add column if not exists stream text;
alter table students add column if not exists city text;
alter table students add column if not exists last_school text;

create table if not exists teacher_subjects (
  id bigint generated always as identity primary key,
  teacher_id bigint references teachers(id) on delete cascade,
  class_name text not null,
  subject text not null,
  created_at timestamp default now()
);

alter table teacher_subjects enable row level security;
do $$ begin
  create policy allow_all on teacher_subjects for all using (true) with check (true);
  exception when duplicate_object then null;
end $$;

alter table students add column if not exists photo_url text;
                                                                                                                                                      alter table students add column if not exists birth_cert_url text;
                                                                                                                                                      alter table students add column if not exists aadhar_url text;
alter table students add column if not exists father_aadhar_url text;

create table if not exists users (
  id bigint generated always as identity primary key,
  email text unique not null,
  password text not null,
  full_name text not null,
  role text not null default 'teacher',
  teacher_id bigint references teachers(id),
  class_name text,
  created_at timestamp default now()
);

alter table users enable row level security;
do $$ begin
  create policy allow_all on users for all using (true) with check (true);
  exception when duplicate_object then null;
end $$;

alter table students add column if not exists roll_no integer;

-- School-wise data: add school_id to all data tables
alter table users add column if not exists school_id bigint references school_info(id);
alter table students add column if not exists school_id bigint references school_info(id);
alter table teachers add column if not exists school_id bigint references school_info(id);
alter table fees add column if not exists school_id bigint references school_info(id);
alter table attendance add column if not exists school_id bigint references school_info(id);
alter table exams add column if not exists school_id bigint references school_info(id);
alter table marks add column if not exists school_id bigint references school_info(id);
alter table divisions add column if not exists school_id bigint references school_info(id);
alter table subjects add column if not exists school_id bigint references school_info(id);
alter table streams add column if not exists school_id bigint references school_info(id);
alter table fee_particulars add column if not exists school_id bigint references school_info(id);
alter table teacher_subjects add column if not exists school_id bigint references school_info(id);
alter table academic_years add column if not exists school_id bigint references school_info(id);

