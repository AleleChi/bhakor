import { PrinterRecord } from '../types';

export abstract class PrinterConnector {
  protected device: PrinterRecord;

  constructor(device: PrinterRecord) {
    this.device = device;
  }

  abstract connect(): Promise<string[]>;
  abstract fetchConsumables(): Promise<{
    toner: number;
    paper: number;
    drum: number;
    maintenanceKit: number;
  }>;
  abstract resetConsumable(type: 'toner' | 'paper' | 'maintenance' | 'drum'): Promise<string>;
}

export class SimulationConnector extends PrinterConnector {
  async connect(): Promise<string[]> {
    return [
      `[SIMULATOR] Connecting via direct mock stream...`,
      `[SIMULATOR] Connected to Virtual Device Port 9100. S/N: ${this.device.serialNumber || 'SN-SIM-9943'}`,
      `[SIMULATOR] Status response successfully gathered: "ONLINE"`,
      `[SIMULATOR] Handshake success.`
    ];
  }

  async fetchConsumables() {
    return {
      toner: this.device.tonerLevel,
      paper: this.device.paperLevel ?? 80,
      drum: this.device.drumLife ?? 85,
      maintenanceKit: this.device.maintenanceKitLife ?? 75
    };
  }

  async resetConsumable(type: 'toner' | 'paper' | 'maintenance' | 'drum'): Promise<string> {
    return `[SIMULATOR] Micro-controller reset complete for resource: ${type.toUpperCase()}`;
  }
}

export class SNMPConnector extends PrinterConnector {
  async connect(): Promise<string[]> {
    return [
      `[SNMP v3 Bridge] Initiating connection on target address ${this.device.ipAddress}:161...`,
      `[SNMP v3 Bridge] Requesting MIB system group (sysDescr.0, sysUpTime.0)...`,
      `[SNMP v3 Bridge] Handshake Success. Mapped manufacturer authentication: "${this.device.vendor}"`
    ];
  }

  async fetchConsumables() {
    return {
      toner: this.device.tonerLevel,
      paper: this.device.paperLevel ?? 80,
      drum: this.device.drumLife ?? 85,
      maintenanceKit: this.device.maintenanceKitLife ?? 75
    };
  }

  async resetConsumable(type: 'toner' | 'paper' | 'maintenance' | 'drum'): Promise<string> {
    return `[SNMP GET-SET] Dispatched SECURE SNMP SET query .1.3.6.1.2.1.43.11.1.1.9.1.1 (Value: 100) -> OK`;
  }
}

export class IPPConnector extends PrinterConnector {
  async connect(): Promise<string[]> {
    return [
      `[IPP/SSL Secure] Connecting to ipp://${this.device.ipAddress}/ipp/print...`,
      `[IPP/SSL Secure] Dispatching Get-Printer-Attributes request payload via HTTPS/443...`,
      `[IPP/SSL Secure] Server certificates validated. Active operational state: "Nominal"`
    ];
  }

  async fetchConsumables() {
    return {
      toner: this.device.tonerLevel,
      paper: this.device.paperLevel ?? 80,
      drum: this.device.drumLife ?? 85,
      maintenanceKit: this.device.maintenanceKitLife ?? 75
    };
  }

  async resetConsumable(type: 'toner' | 'paper' | 'maintenance' | 'drum'): Promise<string> {
    return `[IPP Send-Document] Transmitted print command firmware trigger to reset ${type.toUpperCase()} counters. Http: 200 OK`;
  }
}
