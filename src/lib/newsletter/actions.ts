"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const logoUrl = "https://kenyanbill.co.ke/kb-logo.png";
const siteUrl = "https://kenyanbill.co.ke";
const defaultFromEmail = "updates@kenyanbill.co.ke";
const defaultFromName = "Kenyan Bill";
const discordChannelUrl =
  "https://discord.com/channels/1509664745077342319/1509664956658880522";

async function sendDiscordNotification(email: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL is not configured.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "Kenyan Bill",
        avatar_url: logoUrl,
        embeds: [
          {
            author: {
              name: "Kenyan Bill Newsletter",
              icon_url: logoUrl,
              url: siteUrl,
            },
            title: "🇰🇪 New newsletter subscriber",
            description:
              "A new citizen has joined the Kenyan Bill updates list.",
            color: 0x0b7a3b,
            thumbnail: {
              url: logoUrl,
            },
            fields: [
              {
                name: "Subscriber",
                value: `\`${email}\``,
                inline: false,
              },
              {
                name: "Channel",
                value: "Newsletter signup",
                inline: true,
              },
              {
                name: "Status",
                value: "Subscribed",
                inline: true,
              },
              {
                name: "Community",
                value: `[Join the Discord channel for more updates](${discordChannelUrl})`,
                inline: false,
              },
              {
                name: "Website",
                value: `[Open Kenyan Bill](${siteUrl})`,
                inline: false,
              },
            ],
            footer: {
              text: "Kenyan Bill • Public participation updates",
              icon_url: logoUrl,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        "Failed to send Discord notification:",
        await response.text(),
      );
    }
  } catch (error) {
    console.error("Discord notification error:", error);
  }
}

async function sendWelcomeEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? defaultFromEmail;
  const fromName = process.env.RESEND_FROM_NAME ?? defaultFromName;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured.");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "Welcome to Kenyan Bill Updates",
      html: `
        <div style="font-family: Arial, sans-serif; color: #101010; line-height: 1.6;">
          <img src="${logoUrl}" alt="Kenyan Bill" width="96" style="margin-bottom: 20px;" />

          <h2 style="margin: 0 0 12px;">Welcome to Kenyan Bill Updates</h2>

          <p>Hi there,</p>

          <p>
            Thank you for subscribing to Kenyan Bill. You will now receive the latest updates
            on the Finance Bill 2026, public participation highlights, and important civic
            updates directly to your inbox.
          </p>

          <p>
            For faster updates and community discussion, join our Discord channel:
            <br />
            <a href="${discordChannelUrl}" style="color: #0b7a3b; font-weight: 700;">
              Join the Kenyan Bill Discord channel
            </a>
          </p>

          <p>Stay engaged and make your voice heard.</p>

          <p>— The Kenyan Bill Team</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("Failed to send welcome email:", {
        ...result.error,
        fromEmail,
        hint:
          "Check that RESEND_API_KEY belongs to the Resend account where this exact from domain is verified.",
      });
    }
  } catch (error) {
    console.error("Welcome email error:", error);
  }
}

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    };
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return {
      success: false,
      message: "System error: Database not configured.",
    };
  }

  try {
    const { error } = await supabase.from("subscribers").insert({ email });

    if (error) {
      if (error.code === "23505") {
        return {
          success: true,
          message: "You are already subscribed! Thanks for staying informed.",
        };
      }

      console.error("Subscriber insert error:", error);

      return {
        success: false,
        message: "Failed to subscribe. Please try again later.",
      };
    }

    await Promise.all([
      sendDiscordNotification(email),
      sendWelcomeEmail(email),
    ]);

    return {
      success: true,
      message: "Thank you for subscribing! We'll keep you updated.",
    };
  } catch (err) {
    console.error("Newsletter subscription error:", err);

    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
