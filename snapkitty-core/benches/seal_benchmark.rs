use criterion::{black_box, criterion_group, criterion_main, Criterion};
use snapkitty_core::seal::FFISeal;
use snapkitty_core::chain::Chain;
use snapkitty_core::validate::validate_payload;

fn benchmark_seal_creation(c: &mut Criterion) {
    let payload = r#"{"type": "deal.created", "room": "crm", "data": {"id": "deal_123", "value": 50000}}"#;
    
    c.bench_function("seal_creation", |b| {
        b.iter(|| {
            FFISeal::new(black_box(payload), None).unwrap()
        })
    });
}

fn benchmark_seal_verification(c: &mut Criterion) {
    let payload = r#"{"type": "deal.created", "room": "crm", "data": {"id": "deal_123", "value": 50000}}"#;
    let seal = FFISeal::new(payload, None).unwrap();
    
    c.bench_function("seal_verification", |b| {
        b.iter(|| {
            seal.verify(black_box(payload))
        })
    });
}

fn benchmark_chain_append(c: &mut Criterion) {
    let payload = r#"{"type": "deal.created", "room": "crm", "data": {"id": "deal_123", "value": 50000}}"#;
    
    c.bench_function("chain_append", |b| {
        b.iter(|| {
            let mut chain = Chain::new();
            chain.append(black_box(payload)).unwrap()
        })
    });
}

fn benchmark_validation(c: &mut Criterion) {
    let payload = r#"{"type": "deal.created", "room": "crm", "data": {"id": "deal_123", "value": 50000}}"#;
    
    c.bench_function("payload_validation", |b| {
        b.iter(|| {
            validate_payload(black_box(payload)).unwrap()
        })
    });
}

fn benchmark_chain_verification(c: &mut Criterion) {
    // Create a chain with 100 seals
    let mut chain = Chain::new();
    for i in 0..100 {
        let payload = format!(r#"{{"type": "test.event", "room": "crm", "data": {{"id": "{}"}}}}"#, i);
        chain.append(&payload).unwrap();
    }
    
    c.bench_function("chain_verification_100", |b| {
        b.iter(|| {
            chain.verify().unwrap()
        })
    });
}

criterion_group!(
    benches,
    benchmark_seal_creation,
    benchmark_seal_verification,
    benchmark_chain_append,
    benchmark_validation,
    benchmark_chain_verification
);
criterion_main!(benches);

// Made with Bob
