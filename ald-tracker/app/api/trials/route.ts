import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ClinicalTrialStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    designModule?: {
      phases?: string[];
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        country?: string;
        contacts?: Array<{
          name?: string;
          phone?: string;
          email?: string;
        }>;
      }>;
      centralContacts?: Array<{
        name?: string;
        phone?: string;
        email?: string;
      }>;
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === 'true';
  const db = getDb();

  // Check cache (6 hour TTL unless refresh)
  if (!refresh) {
    const cached = db.prepare(`
      SELECT COUNT(*) as count FROM trials
      WHERE datetime(created_at) > datetime('now', '-6 hours')
    `).get() as { count: number };

    if (cached.count > 0) {
      const trials = db.prepare('SELECT * FROM trials ORDER BY id DESC').all();
      return NextResponse.json({ trials, cached: true });
    }
  }

  try {
    const apiUrl = 'https://clinicaltrials.gov/api/v2/studies?query.cond=Alcoholic+Liver+Disease&filter.overallStatus=RECRUITING&fields=NCTId,BriefTitle,BriefSummary,EligibilityCriteria,Locations,Phase,OverallStatus,ContactsLocationsModule&pageSize=50';

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov API returned ${response.status}`);
    }

    const data = await response.json();
    const studies: ClinicalTrialStudy[] = data.studies || [];

    if (refresh) {
      db.prepare('DELETE FROM trials').run();
    }

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO trials (nct_id, title, phase, status, summary, eligibility, locations, contact_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const study of studies) {
      const ps = study.protocolSection;
      if (!ps) continue;

      const nctId = ps.identificationModule?.nctId || '';
      const title = ps.identificationModule?.briefTitle || '';
      const status = ps.statusModule?.overallStatus || '';
      const summary = ps.descriptionModule?.briefSummary || '';
      const eligibility = ps.eligibilityModule?.eligibilityCriteria || '';
      const phases = ps.designModule?.phases || [];
      const phase = phases.join(', ') || 'N/A';

      const locModule = ps.contactsLocationsModule;
      const locations = (locModule?.locations || []).map((loc) => ({
        facility: loc.facility,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        contacts: loc.contacts || []
      }));

      const centralContacts = locModule?.centralContacts || [];
      const contactInfo = JSON.stringify({ centralContacts, locationContacts: locations.flatMap(l => l.contacts || []) });

      try {
        insertStmt.run(nctId, title, phase, status, summary, eligibility, JSON.stringify(locations), contactInfo);
      } catch {
        // Skip duplicates
      }
    }

    const trials = db.prepare('SELECT * FROM trials ORDER BY id DESC').all();
    return NextResponse.json({ trials, cached: false, total: studies.length });
  } catch (error) {
    console.error('GET /api/trials error:', error);

    const cachedTrials = db.prepare('SELECT * FROM trials ORDER BY id DESC').all();
    if (cachedTrials.length > 0) {
      return NextResponse.json({
        trials: cachedTrials,
        cached: true,
        stale: true,
        error: 'Using cached data due to API error'
      });
    }

    return NextResponse.json({
      error: 'Failed to fetch clinical trials',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
