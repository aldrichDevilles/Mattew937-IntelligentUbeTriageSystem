import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL='https://aeeztnrflvypeudwxlvt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY='sb_secret_IpMKbfCzaDZicIV4VDzi8Q_7rdBC4V2',
);
