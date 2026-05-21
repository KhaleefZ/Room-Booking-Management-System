# Verhoeff Algorithm for Aadhaar Validation
# Based on the Dihedral Group D5

VERHOEFF_TABLE_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

VERHOEFF_TABLE_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 1, 4, 6, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

VERHOEFF_TABLE_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_aadhaar(aadhaar_number):
    """
    Validates an Aadhaar number using the Verhoeff algorithm.
    Allows spaces or hyphens for better user experience.
    """
    # Remove common separators
    sanitized = "".join(filter(str.isdigit, str(aadhaar_number)))
    
    if len(sanitized) != 12:
        return False

    # Aadhaar number should not start with 0 or 1
    if sanitized[0] in ["0", "1"]:
        return False

    # VERHOEFF ALGORITHM CHECK
    # This is a fixed, standard implementation of the Verhoeff algorithm
    # which UIDAI uses for the 12th digit (checksum).
    
    c = 0
    inverted_number = sanitized[::-1]

    for i, digit in enumerate(inverted_number):
        c = VERHOEFF_TABLE_D[c][VERHOEFF_TABLE_P[i % 8][int(digit)]]

    # If the number is valid, the resulting 'c' must be 0
    return c == 0


def generate_aadhaar_checksum(aadhaar_11_digits):
    """
    Utility for developers to generate a 12th digit for testing.
    Input: 11 digit string. Output: 12 digit valid Aadhaar string.
    """
    sanitized = "".join(filter(str.isdigit, str(aadhaar_11_digits)))
    if len(sanitized) != 11:
        return None
        
    c = 0
    # Process 11 digits (i starts from 1 because the checksum will be at position 0 in inverted)
    for i, digit in enumerate(sanitized[::-1]):
        c = VERHOEFF_TABLE_D[c][VERHOEFF_TABLE_P[(i + 1) % 8][int(digit)]]
    
    checksum = VERHOEFF_TABLE_INV[c]
    return sanitized + str(checksum)
