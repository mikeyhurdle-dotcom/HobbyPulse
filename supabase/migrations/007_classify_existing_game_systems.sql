update battle_reports set game_system = 'aos' where game_system = '40k' and (lower(title) like '%age of sigmar%' or lower(title) like '% aos %' or lower(title) like '%sigmar%');
update battle_reports set game_system = 'tow' where game_system = '40k' and (lower(title) like '%old world%' or lower(title) like '%warhammer fantasy%');
update battle_reports set game_system = 'kt' where game_system = '40k' and (lower(title) like '%kill team%' or lower(title) like '%killteam%');
update battle_reports set game_system = '30k' where game_system = '40k' and (lower(title) like '%horus heresy%' or lower(title) like '%30k%');
