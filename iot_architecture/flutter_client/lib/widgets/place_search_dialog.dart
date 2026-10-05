import 'package:flutter/material.dart';
import '../models/transit_place.dart';

class PlaceSearchDialog extends StatefulWidget {
  final String title;
  final bool isPickup;
  final Function(TransitPlace place) onSelectPlace;
  final VoidCallback? onSelectCurrentLocation;

  const PlaceSearchDialog({
    super.key,
    required this.title,
    this.isPickup = false,
    required this.onSelectPlace,
    this.onSelectCurrentLocation,
  });

  @override
  State<PlaceSearchDialog> createState() => _PlaceSearchDialogState();
}

class _PlaceSearchDialogState extends State<PlaceSearchDialog> {
  final TextEditingController _searchController = TextEditingController();
  List<TransitPlace> _filteredPlaces = TransitPlace.defaultTransitPlaces;

  void _onSearchChanged(String query) {
    final q = query.trim().toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filteredPlaces = TransitPlace.defaultTransitPlaces;
      } else {
        _filteredPlaces = TransitPlace.defaultTransitPlaces.where((place) {
          if (place.name.toLowerCase().contains(q)) return true;
          if (place.fullAddress.toLowerCase().contains(q)) return true;
          if (place.aliases.any((alias) => alias.toLowerCase().contains(q))) return true;
          return false;
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = widget.isPickup ? const Color(0xFF0288D1) : const Color(0xFF800020);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600),
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: primaryColor.withOpacity(0.15),
                      child: Icon(Icons.location_on_rounded, size: 18, color: primaryColor),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      widget.title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Search Bar Input
            TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search transit hub, landmark or street...',
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                prefixIcon: Icon(Icons.search_rounded, color: primaryColor, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: Colors.grey.shade100,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Use Current Location Option (Only for pickup)
            if (widget.isPickup && widget.onSelectCurrentLocation != null) ...[
              InkWell(
                onTap: () {
                  widget.onSelectCurrentLocation!();
                  Navigator.of(context).pop();
                },
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0288D1).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: Color(0xFF0288D1),
                        child: Icon(Icons.my_location_rounded, size: 16, color: Colors.white),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Use Current GPS Location',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0288D1),
                              ),
                            ),
                            Text(
                              'Auto-snap to nearest Modern Jeepney corridor',
                              style: TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Divider(height: 20),
            ],

            // Section Label
            Text(
              'POPULAR TRANSIT HUBS & CORRIDORS',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
                color: Colors.grey.shade600,
              ),
            ),

            const SizedBox(height: 6),

            // Search Results List
            Flexible(
              child: _filteredPlaces.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text(
                          'No transit hubs found matching "${_searchController.text}"',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      itemCount: _filteredPlaces.length,
                      separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade100),
                      itemBuilder: (context, index) {
                        final place = _filteredPlaces[index];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          leading: CircleAvatar(
                            radius: 15,
                            backgroundColor: primaryColor.withOpacity(0.1),
                            child: Icon(Icons.directions_bus_rounded, size: 16, color: primaryColor),
                          ),
                          title: Text(
                            place.name,
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            place.fullAddress,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                          onTap: () {
                            widget.onSelectPlace(place);
                            Navigator.of(context).pop();
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
