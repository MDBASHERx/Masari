-- =========================================================
-- my-coach seed: 3 math skills, 12 diagnostic questions
-- Safe to run more than once (upserts).
-- =========================================================

insert into public.skills (id, subject, name, description, prerequisite_id, position) values
  ('fractions',   'math', 'الكسور',          'جمع الكسور ومقارنتها والكسور المتكافئة', null,        1),
  ('equations',   'math', 'المعادلات',       'حل معادلات خطية بسيطة بمجهول واحد',     'fractions', 2),
  ('percentages', 'math', 'النسب المئوية',   'حساب النسبة المئوية والخصم والزيادة',    'fractions', 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  prerequisite_id = excluded.prerequisite_id,
  position = excluded.position;

insert into public.questions (id, skill_id, prompt, options, difficulty) values
  -- Fractions
  ('frac-1', 'fractions', 'ما ناتج 1/2 + 1/4 ؟',              '["2/6","3/4","1/6","2/4"]', 1),
  ('frac-2', 'fractions', 'أيّ كسر يساوي 2/3 ؟',               '["4/6","3/2","2/6","4/9"]', 1),
  ('frac-3', 'fractions', 'ما ناتج 3/5 × 10 ؟',                '["6","30","3/50","5/3"]',   2),
  ('frac-4', 'fractions', 'أيّ الكسور التالية هو الأكبر؟',     '["3/8","2/5","1/2","3/7"]', 2),
  -- Equations
  ('eq-1', 'equations', 'إذا كان x + 7 = 12 فما قيمة x ؟',     '["19","5","-5","12/7"]',    1),
  ('eq-2', 'equations', 'حُلّ المعادلة 3x = 18',                '["6","15","21","54"]',      1),
  ('eq-3', 'equations', 'حُلّ المعادلة 2x − 5 = 9',             '["2","7","14","4.5"]',      2),
  ('eq-4', 'equations', 'إذا كان x ÷ 4 = 3 فما قيمة x ؟',      '["12","3/4","7","4/3"]',    2),
  -- Percentages
  ('pct-1', 'percentages', 'ما هو 25% من 80 ؟',                                 '["20","25","32","55"]',          1),
  ('pct-2', 'percentages', 'اكتب الكسر 3/4 على شكل نسبة مئوية',                  '["34%","43%","75%","0.75%"]',    1),
  ('pct-3', 'percentages', 'سعر قميص 50 وعليه خصم 20%. كم سعره بعد الخصم؟',     '["30","40","45","48"]',          2),
  ('pct-4', 'percentages', 'ارتفع عدد أعضاء نادٍ من 40 إلى 50. ما نسبة الزيادة؟', '["10%","20%","25%","50%"]',      2)
on conflict (id) do update set
  skill_id = excluded.skill_id,
  prompt = excluded.prompt,
  options = excluded.options,
  difficulty = excluded.difficulty;

-- correct_option is the 0-based index inside options
insert into private.answer_keys (question_id, correct_option, explanation) values
  ('frac-1', 1, '1/2 = 2/4، إذن 2/4 + 1/4 = 3/4'),
  ('frac-2', 0, 'نضرب البسط والمقام في 2: 2/3 = 4/6'),
  ('frac-3', 0, '10 ÷ 5 = 2، ثم 2 × 3 = 6'),
  ('frac-4', 2, '1/2 = 0.5 وهو أكبر من 3/7 ≈ 0.43 و 2/5 = 0.4 و 3/8 = 0.375'),
  ('eq-1',   1, 'نطرح 7 من الطرفين: x = 12 − 7 = 5'),
  ('eq-2',   0, 'نقسم الطرفين على 3: x = 6'),
  ('eq-3',   1, '2x = 14، إذن x = 7'),
  ('eq-4',   0, 'نضرب الطرفين في 4: x = 12'),
  ('pct-1',  0, '25% تعني الربع، و 80 ÷ 4 = 20'),
  ('pct-2',  2, '3/4 = 0.75 = 75%'),
  ('pct-3',  1, 'الخصم 20% من 50 يساوي 10، إذن 50 − 10 = 40'),
  ('pct-4',  2, 'الزيادة 10 من أصل 40، و 10 ÷ 40 = 25%')
on conflict (question_id) do update set
  correct_option = excluded.correct_option,
  explanation = excluded.explanation;
