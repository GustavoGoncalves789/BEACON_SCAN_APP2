import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpiPage } from './epi.page';

describe('EpiPage', () => {
  let component: EpiPage;
  let fixture: ComponentFixture<EpiPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EpiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
