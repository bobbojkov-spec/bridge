import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings, updateSiteSettings } from '@/lib/db/repositories/settings';

// GET /api/settings - Get site settings
export async function GET(request: NextRequest) {
  try {
    const settings = await getSiteSettings();
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update site settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updateData: any = {};
    
    if (body.siteName !== undefined) updateData.site_name = body.siteName;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.favicon !== undefined) updateData.favicon = body.favicon;
    if (body.facebookUrl !== undefined) updateData.facebook_url = body.facebookUrl;
    if (body.instagramUrl !== undefined) updateData.instagram_url = body.instagramUrl;
    if (body.twitterUrl !== undefined) updateData.twitter_url = body.twitterUrl;
    if (body.linkedinUrl !== undefined) updateData.linkedin_url = body.linkedinUrl;
    if (body.footerContent !== undefined) updateData.footer_content = body.footerContent;
    if (body.seoDefaultTitle !== undefined) updateData.seo_default_title = body.seoDefaultTitle;
    if (body.seoDefaultDescription !== undefined) updateData.seo_default_description = body.seoDefaultDescription;
    if (body.contactEmail !== undefined) updateData.contact_email = body.contactEmail;
    if (body.contactPhone !== undefined) updateData.contact_phone = body.contactPhone;

    await updateSiteSettings(updateData);

    const settings = await getSiteSettings();
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

