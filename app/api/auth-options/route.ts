import { passwordResetEnabled } from "../../../lib/reset-email";
export const dynamic="force-dynamic";
export function GET(){return Response.json({passwordReset:passwordResetEnabled(),google:!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)},{headers:{"Cache-Control":"no-store"}});}
