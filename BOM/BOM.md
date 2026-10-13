# Bill of Materials (BOM) - Jeepney Passenger Counting System

**Date:** 2026-10-13  
**Schematic Revision:** Ref `Schematic_DP1-please_2026-10-13.png`  
**Scope:** One complete functional prototype (PCB components, external peripherals, antennas, wiring, and enclosure).

## 1. PCB-Mounted Components

| # | Designator | Category | Description / Specs | Qty | Pack | Est. Unit Price (₱) | Pack Cost (₱) | Alloc. Cost (₱) | Status | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | `U1` | Module | ESP32-CAM w/ OV3660 | 1 | 1 | 499.00 | 499.00 | 499.00 | Verified | MakerLab[cite: 21, 22] |
| 2 | `U2` | Module | Luat Air780E Cellular Breakout | 1 | 1 | 350.00 | 350.00 | 350.00 | Estimated |[cite: 21, 22] |
| 3 | `U4` | Module | GY-NEO6MV2 GPS Module | 1 | 1 | 275.00 | 275.00 | 275.00 | Verified | MakerLab[cite: 21, 22] |
| 4 | `BUCK` | Module | XL4015 DC-DC Buck (5A) | 1 | 1 | 75.00 | 75.00 | 75.00 | Verified | MakerLab[cite: 21, 22] |
| 5 | `D1` | Protection | 1.5KE27CA TVS Diode (DO-201AD) | 1 | 1 | 71.17 | 71.17 | 71.17 | Verified | Mouser/Shopee[cite: 21, 22] |
| 6 | `D2` | Protection | 1N5408 Rectifier Diode (DO-201AD)| 1 | 1 | 54.00 | 54.00 | 54.00 | Verified |[cite: 21, 22] |
| 7 | `C1` | Capacitor | 470µF ≥50V Electrolytic | 1 | 1 | 40.00 | 40.00 | 40.00 | Verified | Verify footprint dia.[cite: 21, 22] |
| 8 | `C2` | Capacitor | 1000µF 10V/16V Electrolytic | 1 | 1 | 20.00 | 20.00 | 20.00 | Estimated | Verify footprint dia.[cite: 21] |
| 9 | `C3` | Capacitor | 100nF (0.1µF) 50V Ceramic | 1 | 1 | 5.00 | 5.00 | 5.00 | Estimated |[cite: 21] |
| 10| `R1, R2` | Resistor | 1kΩ, 1/4W, 5% Axial TH | 2 | 100| 0.50 | 50.00 | 1.00 | Estimated | Resistor kit[cite: 21, 22] |
| 11| `R3, R4` | Resistor | 10kΩ, 1/4W, 5% Axial TH | 2 | 100| 0.50 | 50.00 | 1.00 | Estimated | Resistor kit[cite: 21, 22] |
| 12| `BATT, FUSE, SW1`| Connector| 2-Pin Terminal Block 5.00mm 15A | 3 | 10 | 9.90 | 99.00 | 29.70 | Verified | MakerLab[cite: 21, 22] |
| 13| `IR1, IR2` | Connector| 3-Pin Terminal Block 5.08mm | 2 | 10 | 10.00 | 100.00 | 20.00 | Estimated | Confirm 12-24AWG limit[cite: 21] |
| 14| `LED1, 2, SW2`| Connector| 1x2 Male Header (2.54mm) | 3 | 10 | 2.00 | 20.00 | 6.00 | Estimated | Standard dupont[cite: 21] |
| 15| `FTDI` | Connector| 1x3 Male Header (2.54mm) | 1 | 10 | 3.00 | 30.00 | 3.00 | Estimated | Standard dupont[cite: 21] |

## 2. External Modules & Assemblies

| # | Functional Ref | Category | Description / Specs | Qty | Pack | Est. Unit (₱) | Pack Cost (₱) | Alloc. Cost (₱) | Status | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|---|
| 16| `IR Sensors` | Sensor | E18-D80NK Adjustable IR Sensor | 2 | 1 | 120.00 | 240.00 | 240.00 | Verified | MakerLab[cite: 21, 22] |
| 17| `EXT_FUSE` | Protection| 3A Automotive Blade Fuse | 1 | 10 | 4.10 | 41.00 | 4.10 | Verified |[cite: 22] |
| 18| `EXT_FUSE_HLD` | Hardware | Waterproof Inline Fuse Holder 16AWG| 1 | 1 | 37.00 | 37.00 | 37.00 | Verified | MakerLab[cite: 22] |
| 19| `EXT_SW1` | Switch | 12V DC Rocker Switch (Latching) | 1 | 1 | 25.00 | 25.00 | 25.00 | Verified | Main power[cite: 22] |
| 20| `EXT_SW2` | Switch | 12mm Momentary Push Button | 1 | 1 | 30.00 | 30.00 | 30.00 | Estimated | BOOT button[cite: 22] |
| 21| `EXT_LED1, 2` | LED | 5mm LEDs (Assorted Colors) | 2 | 10 | 2.00 | 20.00 | 4.00 | Estimated | Power/Status |
| 22| `EXT_BATT` | Power | 12V Battery | 1 | 1 | 1000.00 | 1000.00 | 1000.00 | Estimated | Needs spec definition[cite: 22] |
| 23| `PROGRAMMER` | Tool | FTDI USB-to-TTL Adapter (3.3V) | 1 | 1 | 150.00 | 150.00 | 150.00 | Estimated | Required for flashing |
| 24| `EXT_SIM` | Telecom | Nano SIM Card (IoT/Data) | 1 | 1 | 40.00 | 40.00 | 40.00 | Estimated | Local telco |

## 3. Antennas, Wiring, & Enclosure

| # | Functional Ref | Category | Description / Specs | Qty | Pack | Est. Unit (₱) | Pack Cost (₱) | Alloc. Cost (₱) | Status | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|---|
| 25| `ANT_PIGTAIL` | Cable | U.FL to SMA Female Pigtail | 2 | 3 | 38.33 | 115.00 | 76.67 | Verified | Connects modules to ext antennas |
| 26| `ANT_LTE` | Antenna | LTE 4G Antenna (SMA Male) | 1 | 1 | 150.00 | 150.00 | 150.00 | Estimated | Match to U2 |
| 27| `ANT_GPS` | Antenna | GPS Patch/Active Antenna (SMA Male)| 1 | 1 | 150.00 | 150.00 | 150.00 | Estimated | Match to U4 |
| 28| `CAM_EXT` | Cable | FPC Ext. Board + 24-Pin FFC Type A| 1 | 1 | 150.00 | 150.00 | 150.00 | Estimated | Extends OV3660 |
| 29| `ENCLOSURE` | Hardware | Custom 3D Printed Jeepney Housing | 1 | 1 | 300.00 | 300.00 | 300.00 | Estimated | Awaiting design |
| 30| `WIRE_PWR` | Wire | 18 AWG Stranded Copper (Red/Black) | 2m| 1 | 100.00 | 100.00 | 100.00 | Estimated | BATT, SW1, FUSE |
| 31| `WIRE_SIG` | Wire | 22 AWG Stranded / Dupont Jumpers | 1 | 1 | 150.00 | 150.00 | 150.00 | Estimated | IRs, LEDs, Buttons |

## Cost Summary (PHP / ₱)

*   **Total Allocated Prototype Cost:** ₱4,056.64
*   **Total Estimated Purchasing Budget:** ₱4,396.17
*(Note: Purchasing budget accounts for minimum pack sizes for terminal blocks, fuses, resistors, and pigtails).*

## Outstanding Decisions & Pre-Purchase Checklist
1. **Air780E & NEO-6M Connectors:** Physically verify if the cellular and GPS modules have U.FL (IPEX) sockets before purchasing the U.FL-to-SMA pigtails.
2. **Capacitor Dimensions:** Determine the physical lead pitch and diameter of `C1` and `C2` before finalizing the PCB footprint.
3. **Enclosure Design:** The 3D enclosure dimensions cannot be finalized until all terminal blocks and headers are placed on the PCB.