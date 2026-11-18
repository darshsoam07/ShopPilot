import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveProductMedia, selectedProductImage } from '../src/features/catalog/productMedia.ts';

const photos = ['/demo/nova.jpg', ...[1, 2, 3, 4].map(i => `/demo/nova-detail-${i}.jpg`)];
const inherited = { image_url: photos[0], gallery_images: photos.slice(1) };

test('Obsidian keeps its five photos in order', () => {
  assert.deepEqual(resolveProductMedia({ ...inherited, sku: 'AUD-NOVA-001' }), { primary: photos[0], gallery: photos });
});

test('persisted Alabaster and empty records have no displayable media', () => {
  for (const record of [{ ...inherited, sku: 'AUD-NOVA-ALB' }, { sku: 'OTHER', image_url: null }]) {
    assert.deepEqual(resolveProductMedia(record), { primary: null, gallery: [] });
  }
});

test('explicit variant media survives mixed legacy galleries and stale selections', () => {
  const own = '/media/upload.jpg';
  const { primary, gallery } = resolveProductMedia({ ...inherited, sku: 'AUD-NOVA-ALB', gallery_images: [...photos, own, own] });
  assert.equal(primary, own);
  assert.deepEqual(gallery, [own]);
  assert.equal(selectedProductImage(gallery, photos[1]), own);
  assert.equal(selectedProductImage([], own), null);
  assert.equal(selectedProductImage(photos, photos[2]), photos[2]);
});

test('only the exact seeded Unsplash URL is inherited in either Alabaster media slot', () => {
  const legacy = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900';
  const uploaded = '/media/alabaster.webp';
  const otherSize = legacy.replace('900', '1200');
  const record = { sku: 'AUD-NOVA-ALB', image_url: legacy };
  assert.deepEqual(resolveProductMedia(record), { primary: null, gallery: [] });
  assert.deepEqual(resolveProductMedia({ ...record, image_url: uploaded, gallery_images: [legacy, otherSize] }),
    { primary: uploaded, gallery: [uploaded, otherSize] });
});
