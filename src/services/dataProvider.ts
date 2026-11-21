import {
  buildDemoAccessLogs,
  buildDemoAttendees,
  buildDemoIncidentsAndAlerts,
  DEMO_CATEGORIES,
  DEMO_EVENTS,
  DEMO_MAP_POINTS,
  DEMO_PATROL_ROUTES,
  DEMO_STAFF,
  DEMO_ZONES,
} from '../data/demoSeed';
import {
  AccessLog,
  Attendee,
  IncidentCategory,
  PatrolRoute,
  SecurityAlert,
  SecurityEvent,
  SecurityIncident,
  SecurityStaff,
  SecurityZone,
  ZoneMapPoint,
} from '../types/security';

export interface SecurityDataset {
  events: SecurityEvent[];
  zones: SecurityZone[];
  mapPoints: ZoneMapPoint[];
  categories: IncidentCategory[];
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  attendees: Attendee[];
  accessLogs: AccessLog[];
  staff: SecurityStaff[];
  patrolRoutes: PatrolRoute[];
  dataMode: 'DEMO';
}

/**
 * Abstraction layer for backend persistence.
 * Allows seamless switching between Demo local state, Node.js/Express REST API,
 * and Firebase Firestore without altering UI components or analytics logic.
 */
export interface SecurityDataRepository {
  readonly mode: 'DEMO' | 'NODE_API' | 'FIREBASE';
  loadDataset(): Promise<SecurityDataset>;
  saveIncident?(incident: SecurityIncident): Promise<void>;
  updateAlert?(alert: SecurityAlert): Promise<void>;
  saveEvent?(event: SecurityEvent): Promise<void>;
}

export class DemoSecurityRepository implements SecurityDataRepository {
  readonly mode = 'DEMO' as const;

  async loadDataset(): Promise<SecurityDataset> {
    const attendees = buildDemoAttendees();
    const { incidents, alerts } = buildDemoIncidentsAndAlerts();
    const accessLogs = buildDemoAccessLogs(attendees);

    return {
      events: [...DEMO_EVENTS],
      zones: [...DEMO_ZONES],
      mapPoints: [...DEMO_MAP_POINTS],
      categories: [...DEMO_CATEGORIES],
      incidents,
      alerts,
      attendees,
      accessLogs,
      staff: [...DEMO_STAFF],
      patrolRoutes: [...DEMO_PATROL_ROUTES],
      dataMode: 'DEMO',
    };
  }
}

/**
 * Blueprint adapter for Node.js/Express backend integration (/api/*).
 * Ready to activate when connecting to live SOC backend services.
 */
export class NodeApiSecurityRepository implements SecurityDataRepository {
  readonly mode = 'NODE_API' as const;
  private readonly baseUrl: string;

  constructor(baseUrl = '/api/security') {
    this.baseUrl = baseUrl;
  }

  async loadDataset(): Promise<SecurityDataset> {
    const res = await fetch(`${this.baseUrl}/bootstrap`);
    if (!res.ok) {
      throw new Error(`Không thể kết nối máy chủ điều hành (${res.status})`);
    }
    return res.json() as Promise<SecurityDataset>;
  }

  async saveIncident(incident: SecurityIncident): Promise<void> {
    await fetch(`${this.baseUrl}/incidents/${incident.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
  }

  async updateAlert(alert: SecurityAlert): Promise<void> {
    await fetch(`${this.baseUrl}/alerts/${alert.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
  }
}

export const defaultRepository: SecurityDataRepository = new DemoSecurityRepository();
