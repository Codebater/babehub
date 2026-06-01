-- Migration 0025: capture applicant gender on the apply form.
-- Quick Apply asks woman / man / non_binary so the team can prioritise.
alter table public.survey_submissions
  add column if not exists gender text
    check (gender in ('woman', 'man', 'non_binary'));
