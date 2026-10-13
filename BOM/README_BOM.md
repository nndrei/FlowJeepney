# Passenger Counting System BOM

This repository contains the Bill of Materials (BOM) for a camera-based jeepney passenger counting system, developed using EasyEDA Standard. 

## Files Included
* **`BOM.md`**: A formatted Markdown table intended for quick reading on GitHub. It separates items by functional category.
* **`README.md`**: This document.

## How to Read This BOM

* **Installed Qty vs. Pack Size**: The BOM explicitly tracks the quantity of a component used in *one prototype* versus the minimum quantity you must buy from a supplier. (For example, 2 terminal blocks are used, but they are sold in packs of 10). 
* **Allocated Cost vs. Pack Cost**: "Allocated Cost" reflects the price of the exact pieces used in the prototype. "Pack Cost" reflects the actual out-of-pocket budget required to buy the materials. 
* **Pricing & Estimates**: Prices marked **"Verified"** are drawn from the original project spreadsheet or matched to MakerLab PH listings. Prices marked **"Estimated"** are standard local market budgetary placeholders (PHP) and must be verified at the time of purchase. 

## Wire Gauge Compatibility Recommendations
Do not use a single wire gauge for the whole project. 
* **Main Power (18 AWG Stranded):** Use for Battery input, external Fuse, and main Rocker Switch. This provides mechanical robustness and safely handles the ~1.5A–2.0A peak current drawn by the system and cellular module. The chosen MakerLab 2-pin 5.00mm terminal blocks officially accept 12–24 AWG, making 18 AWG an ideal fit. *(Note: Do not use bootlace ferrules if they prevent the wire from seating properly in the elevator-style terminal clamp).*
* **Signal Lines (22 AWG Stranded / Dupont):** Use for IR sensors, external LEDs, the BOOT button, and FTDI UART lines. These carry less than 50mA. The 3-pin 5.08mm terminal blocks easily accept 22 AWG.

## Known Limitations & Pre-Purchase Requirements
1. **Flashing Limitations:** Automatic flashing is not supported. The design requires manual flashing using the 3-pin `FTDI` header and external `SW2` BOOT button. 
2. **Component Dimensions:** The schematic is verified, but PCB layout cannot commence until the physical lead pitch and diameter of `C1` (470µF) and `C2` (1000µF) are measured from the physical purchased components.
3. **Antennas:** Ensure the selected Luat Air780E and NEO-6M modules possess physical U.FL (IPEX) sockets before purchasing the U.FL-to-SMA pigtail cables.
4. **Enclosure:** The custom 3D enclosure is represented as a budgetary estimate. It must be designed *after* the PCB routing is complete to properly locate mounting holes and cable glands.