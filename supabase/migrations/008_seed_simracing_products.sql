-- 008_seed_simracing_products.sql
-- Seed the products table with sim racing hardware products
-- All prices in pence GBP

INSERT INTO products (vertical_id, name, slug, manufacturer, rrp_pence, image_url, category_id, keywords)
VALUES

-- =========================================================================
-- WHEELBASES
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec CSL DD (5Nm)', 'fanatec-csl-dd-5nm', 'Fanatec', 29995, NULL, NULL,
  ARRAY['fanatec', 'csl dd', 'csl', 'direct drive', 'wheelbase', '5nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec CSL DD (8Nm)', 'fanatec-csl-dd-8nm', 'Fanatec', 44995, NULL, NULL,
  ARRAY['fanatec', 'csl dd', 'csl', 'direct drive', 'wheelbase', '8nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec GT DD Pro (8Nm)', 'fanatec-gt-dd-pro-8nm', 'Fanatec', 59995, NULL, NULL,
  ARRAY['fanatec', 'gt dd pro', 'gt dd', 'direct drive', 'wheelbase', '8nm', 'playstation']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec ClubSport DD', 'fanatec-clubsport-dd', 'Fanatec', 74995, NULL, NULL,
  ARRAY['fanatec', 'clubsport dd', 'clubsport', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec ClubSport DD+', 'fanatec-clubsport-dd-plus', 'Fanatec', 99995, NULL, NULL,
  ARRAY['fanatec', 'clubsport dd+', 'clubsport dd plus', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza R3', 'moza-r3', 'Moza', 14999, NULL, NULL,
  ARRAY['moza', 'r3', 'moza r3', 'direct drive', 'wheelbase', '3nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza R5', 'moza-r5', 'Moza', 24999, NULL, NULL,
  ARRAY['moza', 'r5', 'moza r5', 'direct drive', 'wheelbase', '5nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza R9', 'moza-r9', 'Moza', 44999, NULL, NULL,
  ARRAY['moza', 'r9', 'moza r9', 'direct drive', 'wheelbase', '9nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza R12', 'moza-r12', 'Moza', 59999, NULL, NULL,
  ARRAY['moza', 'r12', 'moza r12', 'direct drive', 'wheelbase', '12nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza R16', 'moza-r16', 'Moza', 89999, NULL, NULL,
  ARRAY['moza', 'r16', 'moza r16', 'direct drive', 'wheelbase', '16nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza R21', 'moza-r21', 'Moza', 119999, NULL, NULL,
  ARRAY['moza', 'r21', 'moza r21', 'direct drive', 'wheelbase', '21nm']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Simagic Alpha Mini', 'simagic-alpha-mini', 'Simagic', 39999, NULL, NULL,
  ARRAY['simagic', 'alpha mini', 'simagic alpha mini', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Simagic Alpha', 'simagic-alpha', 'Simagic', 74999, NULL, NULL,
  ARRAY['simagic', 'alpha', 'simagic alpha', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Simagic Alpha U', 'simagic-alpha-u', 'Simagic', 109999, NULL, NULL,
  ARRAY['simagic', 'alpha u', 'simagic alpha u', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Asetek Invicta', 'asetek-invicta', 'Asetek', 99999, NULL, NULL,
  ARRAY['asetek', 'invicta', 'asetek invicta', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Logitech G923', 'logitech-g923', 'Logitech', 24999, NULL, NULL,
  ARRAY['logitech', 'g923', 'logitech g923', 'wheelbase', 'gear drive', 'trueforce']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Logitech G Pro', 'logitech-g-pro', 'Logitech', 99999, NULL, NULL,
  ARRAY['logitech', 'g pro', 'logitech g pro', 'direct drive', 'wheelbase']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Thrustmaster T300 RS', 'thrustmaster-t300-rs', 'Thrustmaster', 29999, NULL, NULL,
  ARRAY['thrustmaster', 't300', 't300 rs', 'thrustmaster t300', 'wheelbase', 'belt drive']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Thrustmaster T598', 'thrustmaster-t598', 'Thrustmaster', 49999, NULL, NULL,
  ARRAY['thrustmaster', 't598', 'thrustmaster t598', 'wheelbase', 'direct drive']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'PXN V99', 'pxn-v99', 'PXN', 19900, NULL, NULL,
  ARRAY['pxn', 'v99', 'pxn v99', 'wheelbase', 'direct drive']),

-- =========================================================================
-- PEDALS
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec CSL Pedals', 'fanatec-csl-pedals', 'Fanatec', 7995, NULL, NULL,
  ARRAY['fanatec', 'csl pedals', 'csl', 'pedals']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec CSL Pedals LC', 'fanatec-csl-pedals-lc', 'Fanatec', 13995, NULL, NULL,
  ARRAY['fanatec', 'csl pedals lc', 'csl', 'pedals', 'load cell', 'loadcell']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec ClubSport Pedals V3', 'fanatec-clubsport-pedals-v3', 'Fanatec', 35995, NULL, NULL,
  ARRAY['fanatec', 'clubsport pedals', 'clubsport pedals v3', 'pedals', 'load cell']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza CRP Pedals', 'moza-crp-pedals', 'Moza', 19999, NULL, NULL,
  ARRAY['moza', 'crp', 'moza crp', 'pedals']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza SRP Pedals', 'moza-srp-pedals', 'Moza', 29999, NULL, NULL,
  ARRAY['moza', 'srp', 'moza srp', 'pedals', 'load cell']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza CRP2 Pedals', 'moza-crp2-pedals', 'Moza', 24999, NULL, NULL,
  ARRAY['moza', 'crp2', 'moza crp2', 'pedals']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Simagic P-HYP Pedals', 'simagic-p-hyp-pedals', 'Simagic', 44999, NULL, NULL,
  ARRAY['simagic', 'p-hyp', 'simagic p-hyp', 'pedals', 'hydraulic']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Asetek Forte Pedals', 'asetek-forte-pedals', 'Asetek', 49999, NULL, NULL,
  ARRAY['asetek', 'forte', 'asetek forte', 'pedals', 'load cell']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Heusinkveld Sprint Pedals', 'heusinkveld-sprint-pedals', 'Heusinkveld', 59999, NULL, NULL,
  ARRAY['heusinkveld', 'sprint', 'heusinkveld sprint', 'pedals', 'load cell']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Heusinkveld Ultimate Pedals', 'heusinkveld-ultimate-pedals', 'Heusinkveld', 99999, NULL, NULL,
  ARRAY['heusinkveld', 'ultimate', 'heusinkveld ultimate', 'pedals', 'load cell', 'hydraulic']),

-- =========================================================================
-- STEERING WHEELS
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec CSL Steering Wheel', 'fanatec-csl-steering-wheel', 'Fanatec', 9995, NULL, NULL,
  ARRAY['fanatec', 'csl steering wheel', 'csl wheel', 'steering wheel', 'wheel rim']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec ClubSport RS Wheel', 'fanatec-clubsport-rs-wheel', 'Fanatec', 29995, NULL, NULL,
  ARRAY['fanatec', 'clubsport rs', 'rs wheel', 'steering wheel', 'wheel rim', 'round wheel']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec ClubSport GT Wheel', 'fanatec-clubsport-gt-wheel', 'Fanatec', 34995, NULL, NULL,
  ARRAY['fanatec', 'clubsport gt', 'gt wheel', 'steering wheel', 'wheel rim']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza ES Wheel', 'moza-es-wheel', 'Moza', 14999, NULL, NULL,
  ARRAY['moza', 'es', 'moza es', 'es wheel', 'steering wheel', 'wheel rim']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza GS Wheel', 'moza-gs-wheel', 'Moza', 19999, NULL, NULL,
  ARRAY['moza', 'gs', 'moza gs', 'gs wheel', 'steering wheel', 'wheel rim', 'round wheel']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza RS Wheel', 'moza-rs-wheel', 'Moza', 24999, NULL, NULL,
  ARRAY['moza', 'rs', 'moza rs', 'rs wheel', 'steering wheel', 'wheel rim', 'round wheel']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza FSR Formula Wheel', 'moza-fsr-formula-wheel', 'Moza', 39999, NULL, NULL,
  ARRAY['moza', 'fsr', 'moza fsr', 'formula wheel', 'steering wheel', 'wheel rim', 'formula']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Simagic GTS Wheel', 'simagic-gts-wheel', 'Simagic', 24999, NULL, NULL,
  ARRAY['simagic', 'gts', 'simagic gts', 'gts wheel', 'steering wheel', 'wheel rim']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Simagic GT Neo Wheel', 'simagic-gt-neo-wheel', 'Simagic', 34999, NULL, NULL,
  ARRAY['simagic', 'gt neo', 'simagic gt neo', 'steering wheel', 'wheel rim']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Cube Controls Formula CSX 2', 'cube-controls-formula-csx-2', 'Cube Controls', 89999, NULL, NULL,
  ARRAY['cube controls', 'formula csx', 'csx 2', 'formula wheel', 'steering wheel', 'wheel rim']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Ascher Racing F64-USB V3', 'ascher-racing-f64-usb-v3', 'Ascher Racing', 69999, NULL, NULL,
  ARRAY['ascher', 'ascher racing', 'f64', 'f64-usb', 'formula wheel', 'steering wheel', 'wheel rim']),

-- =========================================================================
-- RIGS & COCKPITS
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Sim-Lab GT1 Evo', 'sim-lab-gt1-evo', 'Sim-Lab', 49900, NULL, NULL,
  ARRAY['sim-lab', 'simlab', 'gt1 evo', 'gt1', 'rig', 'cockpit', 'aluminium profile']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Sim-Lab P1-X', 'sim-lab-p1-x', 'Sim-Lab', 59900, NULL, NULL,
  ARRAY['sim-lab', 'simlab', 'p1-x', 'p1x', 'rig', 'cockpit', 'aluminium profile']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Sim-Lab WS-Pro', 'sim-lab-ws-pro', 'Sim-Lab', 29900, NULL, NULL,
  ARRAY['sim-lab', 'simlab', 'ws-pro', 'ws pro', 'wheel stand', 'stand']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Trak Racer TR80', 'trak-racer-tr80', 'Trak Racer', 29900, NULL, NULL,
  ARRAY['trak racer', 'tr80', 'rig', 'cockpit', 'aluminium profile']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Trak Racer TR120', 'trak-racer-tr120', 'Trak Racer', 39900, NULL, NULL,
  ARRAY['trak racer', 'tr120', 'rig', 'cockpit', 'aluminium profile']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Trak Racer TR160', 'trak-racer-tr160', 'Trak Racer', 44900, NULL, NULL,
  ARRAY['trak racer', 'tr160', 'rig', 'cockpit', 'aluminium profile']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Next Level Racing F-GT', 'next-level-racing-f-gt', 'Next Level Racing', 34999, NULL, NULL,
  ARRAY['next level racing', 'nlr', 'f-gt', 'fgt', 'rig', 'cockpit']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Next Level Racing F-GT Lite', 'next-level-racing-f-gt-lite', 'Next Level Racing', 19999, NULL, NULL,
  ARRAY['next level racing', 'nlr', 'f-gt lite', 'fgt lite', 'rig', 'cockpit', 'foldable']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Next Level Racing GT Track', 'next-level-racing-gt-track', 'Next Level Racing', 54999, NULL, NULL,
  ARRAY['next level racing', 'nlr', 'gt track', 'rig', 'cockpit']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Playseat Trophy', 'playseat-trophy', 'Playseat', 49999, NULL, NULL,
  ARRAY['playseat', 'trophy', 'playseat trophy', 'rig', 'cockpit']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Playseat Challenge X', 'playseat-challenge-x', 'Playseat', 24999, NULL, NULL,
  ARRAY['playseat', 'challenge x', 'playseat challenge', 'rig', 'cockpit', 'foldable']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'GT Omega Titan', 'gt-omega-titan', 'GT Omega', 39999, NULL, NULL,
  ARRAY['gt omega', 'titan', 'gt omega titan', 'rig', 'cockpit', 'aluminium profile']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'GT Omega Prime', 'gt-omega-prime', 'GT Omega', 29999, NULL, NULL,
  ARRAY['gt omega', 'prime', 'gt omega prime', 'rig', 'cockpit']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Rseat RS1', 'rseat-rs1', 'Rseat', 99999, NULL, NULL,
  ARRAY['rseat', 'rs1', 'rseat rs1', 'rig', 'cockpit']),

-- =========================================================================
-- MONITORS
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Samsung Odyssey G9 (49")', 'samsung-odyssey-g9-49', 'Samsung', 99999, NULL, NULL,
  ARRAY['samsung', 'odyssey g9', 'g9', 'ultrawide', 'monitor', '49 inch', '49"', 'curved']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Samsung Odyssey Neo G9 (49")', 'samsung-odyssey-neo-g9-49', 'Samsung', 179999, NULL, NULL,
  ARRAY['samsung', 'odyssey neo g9', 'neo g9', 'ultrawide', 'monitor', '49 inch', '49"', 'curved', 'mini led']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Dell AW3423DWF (34" OLED)', 'dell-aw3423dwf-34-oled', 'Dell', 79999, NULL, NULL,
  ARRAY['dell', 'alienware', 'aw3423dwf', 'ultrawide', 'monitor', '34 inch', '34"', 'oled', 'curved']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'LG 27GP850-B (27" 165Hz)', 'lg-27gp850-b-27-165hz', 'LG', 34999, NULL, NULL,
  ARRAY['lg', '27gp850', 'monitor', '27 inch', '27"', '165hz', 'ips', 'gaming monitor']),

-- =========================================================================
-- VR HEADSETS
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Meta Quest 3', 'meta-quest-3', 'Meta', 47999, NULL, NULL,
  ARRAY['meta', 'quest 3', 'meta quest 3', 'oculus', 'vr', 'vr headset', 'virtual reality']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Meta Quest 3S', 'meta-quest-3s', 'Meta', 29999, NULL, NULL,
  ARRAY['meta', 'quest 3s', 'meta quest 3s', 'oculus', 'vr', 'vr headset', 'virtual reality']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Pimax Crystal', 'pimax-crystal', 'Pimax', 159999, NULL, NULL,
  ARRAY['pimax', 'crystal', 'pimax crystal', 'vr', 'vr headset', 'virtual reality', 'pcvr']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'HP Reverb G2', 'hp-reverb-g2', 'HP', 44999, NULL, NULL,
  ARRAY['hp', 'reverb', 'reverb g2', 'hp reverb g2', 'vr', 'vr headset', 'virtual reality', 'wmr']),

-- =========================================================================
-- ACCESSORIES
-- =========================================================================
((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec Shifter SQ V1.5', 'fanatec-shifter-sq-v1-5', 'Fanatec', 25995, NULL, NULL,
  ARRAY['fanatec', 'shifter', 'sq v1.5', 'sequential', 'h-pattern', 'gear shifter']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza HGP Shifter', 'moza-hgp-shifter', 'Moza', 14999, NULL, NULL,
  ARRAY['moza', 'hgp', 'moza hgp', 'shifter', 'sequential', 'h-pattern', 'gear shifter']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Fanatec Handbrake V1.5', 'fanatec-handbrake-v1-5', 'Fanatec', 12995, NULL, NULL,
  ARRAY['fanatec', 'handbrake', 'v1.5', 'hand brake', 'ebrake']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Moza HBP Handbrake', 'moza-hbp-handbrake', 'Moza', 9999, NULL, NULL,
  ARRAY['moza', 'hbp', 'moza hbp', 'handbrake', 'hand brake', 'ebrake']),

((SELECT id FROM verticals WHERE slug = 'simracing'), 'Buttkicker Gamer 2', 'buttkicker-gamer-2', 'Buttkicker', 14999, NULL, NULL,
  ARRAY['buttkicker', 'gamer 2', 'buttkicker gamer', 'bass shaker', 'haptic', 'tactile transducer'])

ON CONFLICT (slug, vertical_id) DO UPDATE SET
  name = EXCLUDED.name,
  manufacturer = EXCLUDED.manufacturer,
  rrp_pence = EXCLUDED.rrp_pence,
  keywords = EXCLUDED.keywords;
