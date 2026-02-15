use std::hash::poseidon::bn254::hash_1;
use std::hash::poseidon::bn254::hash_2;
////// Checkpoint 4 //////
use binary_merkle_root::binary_merkle_root;

fn main(
    // public inputs
    nullifier_hash: pub Field,
    // private inputs
    nullifier: Field,
    secret: Field,
    ////// Checkpoint 4 //////
    // public inputs
    root: pub Field,
    vote: pub bool,
    depth: pub u32,
    // private inputs
    index: Field,
    siblings: [Field; 16],
) {
    ////// Checkpoint 3 //////
    // Recompute the nullifier hash and assert it matches the public input
    let computed_nullifier_hash = hash_1([nullifier]);
    assert(computed_nullifier_hash == nullifier_hash);

    // Build the commitment from nullifier + secret
    let commitment = hash_2([nullifier, secret]);

    ////// Checkpoint 4 //////
    // Count non-zero siblings to get the real path length
    let mut siblings_num: u32 = 0;
    for i in 0..16 {
        if siblings[i] != 0 {
            siblings_num += 1;
        }
    }

    // Safety bound: depth must not exceed sibling array length
    assert(depth <= 16);

    // Convert index to little-endian bits
    let index_bits: [u1; 16] = index.to_le_bits();

    // Compute the Merkle root using poseidon hash_2 as the hasher
    let computed_root = binary_merkle_root(hash_2, commitment, siblings_num, index_bits, siblings);

    // Assert the computed root matches the public root
    assert(computed_root == root);

    // Bind the vote to the proof (x^2 = x constraint for bool)
    let vote_field = vote as Field;
    assert(vote_field * vote_field == vote_field);
}
